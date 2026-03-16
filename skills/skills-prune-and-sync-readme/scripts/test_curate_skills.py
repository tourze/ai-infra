#!/usr/bin/env python3
"""Smoke tests for curate_skills.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name('curate_skills.py')


def write_skill(skill_dir: Path, frontmatter: str, body: str) -> None:
    skill_dir.mkdir(parents=True, exist_ok=True)
    (skill_dir / 'SKILL.md').write_text(
        f'---\n{frontmatter}\n---\n\n{body}\n',
        encoding='utf-8',
    )


def run_command(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT_PATH), *args],
        capture_output=True,
        text=True,
        timeout=30,
    )


def assert_contains_pair(pairs: list[dict[str, object]], left: str, right: str) -> None:
    targets = {left, right}
    for pair in pairs:
        names = set(pair.get('skills', []))
        if names == targets:
            return
    raise AssertionError(f'Expected pair not found: {left}, {right}')


def main() -> int:
    if not SCRIPT_PATH.exists():
        raise AssertionError(f'Missing script under test: {SCRIPT_PATH}')

    with tempfile.TemporaryDirectory(prefix='curate-skills-') as temp_dir:
        repo_root = Path(temp_dir)
        skills_dir = repo_root / 'skills'
        skills_dir.mkdir(parents=True, exist_ok=True)

        write_skill(
            skills_dir / 'alpha-skill',
            'name: alpha-skill\ndescription: Alpha workflow for internal repo cleanup tasks.',
            '# Alpha Skill\n\n## Workflow\n- Audit before cleanup.\n- Keep evidence.\n',
        )
        write_skill(
            skills_dir / 'alpha-skill-audit',
            'name: alpha-skill-audit\ndescription: Alpha workflow for internal repo cleanup tasks and reporting.',
            '# Alpha Skill Audit\n\n## Workflow\n- Audit before cleanup.\n- Keep evidence.\n',
        )
        write_skill(
            skills_dir / 'vue-best-practices',
            'name: vue-best-practices\ndescription: MUST be used for any Vue task. Always prefer Composition API.',
            '# Vue Best Practices\n\n## Workflow\n- Use for any Vue task.\n',
        )
        write_skill(
            skills_dir / 'vue-options-api-only',
            'name: vue-options-api-only\ndescription: Vue 3 Options API style only.',
            '# Vue Options API Only\n\n## Workflow\n- Use when the project explicitly requires Options API.\n',
        )
        write_skill(
            skills_dir / 'stub-skill',
            'name: stub-skill\ndescription: TODO\nversion: 1.0.0',
            '# Stub Skill\n\nTODO\n',
        )

        readme_path = repo_root / 'README.md'
        readme_path.write_text(
            '# Demo Repo\n\n'
            '## Skill 清单\n\n'
            '以下清单按仓库中实际存在的公共 `skills/*/SKILL.md` 整理，不包含 `.system` 内置 skill。名称可直接跳转到对应说明文件。\n\n'
            '### 公共 Skills（1）\n\n'
            '| 名称 | 作用简介 |\n'
            '|------|----------|\n'
            '| [alpha-skill](skills/alpha-skill/SKILL.md) | 旧摘要，应被保留。 |\n\n'
            '## 数据来源\n\n'
            '- example\n',
            encoding='utf-8',
        )

        audit = run_command('audit', '--repo-root', str(repo_root), '--format', 'json')
        if audit.returncode != 0:
            raise AssertionError(f'audit failed:\nSTDOUT:\n{audit.stdout}\nSTDERR:\n{audit.stderr}')

        report = json.loads(audit.stdout)
        low_quality_names = {item['skill'] for item in report['low_quality_candidates']}
        if 'stub-skill' not in low_quality_names:
            raise AssertionError(f'stub-skill should be low quality: {report}')

        assert_contains_pair(report['duplicate_candidates'], 'alpha-skill', 'alpha-skill-audit')
        assert_contains_pair(report['conflict_candidates'], 'vue-best-practices', 'vue-options-api-only')

        prune = run_command(
            'prune',
            '--repo-root',
            str(repo_root),
            '--skills',
            'stub-skill',
            '--yes',
        )
        if prune.returncode != 0:
            raise AssertionError(f'prune failed:\nSTDOUT:\n{prune.stdout}\nSTDERR:\n{prune.stderr}')
        if (skills_dir / 'stub-skill').exists():
            raise AssertionError('stub-skill should be deleted')

        sync = run_command('sync-readme', '--repo-root', str(repo_root), '--write')
        if sync.returncode != 0:
            raise AssertionError(f'sync-readme failed:\nSTDOUT:\n{sync.stdout}\nSTDERR:\n{sync.stderr}')

        readme = readme_path.read_text(encoding='utf-8')
        if '### 公共 Skills（4）' not in readme:
            raise AssertionError(f'Unexpected skill count in README:\n{readme}')
        if '| [alpha-skill](skills/alpha-skill/SKILL.md) | 旧摘要，应被保留。 |' not in readme:
            raise AssertionError('Existing summary should be preserved')
        if 'skills/skills-prune-and-sync-readme/SKILL.md' in readme:
            raise AssertionError('Fixture repo should not contain real repo skills')

        check = run_command('sync-readme', '--repo-root', str(repo_root), '--check')
        if check.returncode != 0:
            raise AssertionError(f'sync-readme --check failed:\nSTDOUT:\n{check.stdout}\nSTDERR:\n{check.stderr}')

    print('curate_skills smoke test passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
