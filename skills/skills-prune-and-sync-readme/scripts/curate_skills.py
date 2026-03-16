#!/usr/bin/env python3
"""Audit, prune, and sync repository skills metadata."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any


ALLOWED_FRONTMATTER_KEYS = {'name', 'description'}
README_SECTION_START = '## Skill 清单'
README_SECTION_END = '## 数据来源'
STOP_WORDS = {
    'a', 'an', 'and', 'api', 'app', 'application', 'best', 'by', 'code', 'covers',
    'default', 'for', 'from', 'guide', 'help', 'how', 'in', 'is', 'it', 'its',
    'must', 'of', 'on', 'or', 'skill', 'skills', 'style', 'task', 'tasks', 'the',
    'this', 'to', 'tool', 'tools', 'use', 'used', 'using', 'when', 'with', 'workflow',
}
LOW_QUALITY_PATTERNS = (
    re.compile(r'\bTODO\b', re.IGNORECASE),
    re.compile(r'\bTBD\b', re.IGNORECASE),
    re.compile(r'placeholder', re.IGNORECASE),
)
EXCLUSIVE_MARKERS = (
    'must be used',
    'must use',
    'always use',
    'always prefer',
    'only',
    'do not use',
    '必须',
    '仅限',
    '只在',
    '禁止',
)
BROAD_SCOPE_MARKERS = (
    'any ',
    'all ',
    'must be used for',
    'always use',
    'for any',
    '任何',
    '全部',
)
SUMMARY_SPLIT_PATTERNS = (
    ' Use when ',
    ' This skill should be used when ',
    ' Also use when ',
    ' Triggers on ',
    ' Trigger with ',
    ' Use this whenever ',
    ' 适合',
    ' 用户提到',
    ' 当用户',
)


@dataclass
class SkillRecord:
    folder: str
    skill_dir: Path
    skill_file: Path
    name: str
    description: str
    frontmatter_keys: list[str]
    body: str
    broken_links: list[str]
    issues: list[str]
    quality_score: int

    @property
    def link(self) -> str:
        return f'skills/{self.folder}/SKILL.md'

    def to_summary(self) -> dict[str, Any]:
        return {
            'skill': self.folder,
            'name': self.name,
            'path': self.link,
            'quality_score': self.quality_score,
            'issues': self.issues,
        }


def strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1].strip()
    return value


def parse_frontmatter(content: str) -> tuple[dict[str, str], list[str], str]:
    if not content.startswith('---\n'):
        return {}, [], content

    closing = content.find('\n---', 4)
    if closing == -1:
        return {}, [], content

    raw_frontmatter = content[4:closing].splitlines()
    body = content[closing + 4:].lstrip('\n')
    data: dict[str, str] = {}
    keys: list[str] = []

    index = 0
    while index < len(raw_frontmatter):
        raw_line = raw_frontmatter[index]
        line = raw_line.strip()
        if not line or line.startswith('#') or ':' not in line:
            index += 1
            continue
        key, raw_value = line.split(':', 1)
        key = key.strip()
        keys.append(key)
        raw_value = raw_value.strip()

        if raw_value in {'|', '>'}:
            block_lines: list[str] = []
            index += 1
            while index < len(raw_frontmatter):
                candidate = raw_frontmatter[index]
                if candidate.startswith((' ', '\t')):
                    block_lines.append(candidate.strip())
                    index += 1
                    continue
                break
            data[key] = '\n'.join(block_lines).strip()
            continue

        data[key] = strip_quotes(raw_value)
        index += 1

    return data, keys, body


def find_broken_links(skill_dir: Path, body: str) -> list[str]:
    broken: list[str] = []
    for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)', body):
        target = target.strip()
        if not target or target.startswith(('#', 'http://', 'https://', 'mailto:')):
            continue
        resolved = (skill_dir / target).resolve()
        if not resolved.exists():
            broken.append(target)
    return sorted(set(broken))


def compute_quality(
    folder: str,
    frontmatter: dict[str, str],
    frontmatter_keys: list[str],
    body: str,
    broken_links: list[str],
) -> tuple[int, list[str]]:
    issues: list[str] = []
    score = 100
    name = frontmatter.get('name', '').strip()
    description = frontmatter.get('description', '').strip()
    body_stripped = body.strip()

    if not name:
        score -= 40
        issues.append('缺少 frontmatter.name')
    if not description:
        score -= 40
        issues.append('缺少 frontmatter.description')
    if name and name != folder:
        score -= 10
        issues.append(f'文件夹名与 frontmatter.name 不一致: {folder} != {name}')

    extra_keys = [key for key in frontmatter_keys if key not in ALLOWED_FRONTMATTER_KEYS]
    if extra_keys:
        score -= 5
        issues.append(f'frontmatter 包含额外字段: {", ".join(extra_keys[:6])}')

    if not body_stripped:
        score -= 30
        issues.append('正文为空')
    else:
        body_length = len(body_stripped)
        if body_length < 120:
            score -= 25
            issues.append(f'正文过短: {body_length} 字符')
        elif body_length < 300:
            score -= 15
            issues.append(f'正文偏短: {body_length} 字符')
        elif body_length < 600:
            score -= 5
            issues.append(f'正文略短: {body_length} 字符')

        if not re.search(r'(?m)^#\s+\S', body_stripped):
            score -= 10
            issues.append('缺少一级标题')

        for pattern in LOW_QUALITY_PATTERNS:
            if pattern.search(body_stripped) or pattern.search(description):
                score -= 20
                issues.append(f'包含占位/未完成标记: {pattern.pattern}')
                break

    if description and len(description) < 12:
        score -= 15
        issues.append(f'description 过短: {len(description)} 字符')

    if broken_links:
        score -= 15
        issues.append(f'存在失效相对链接: {", ".join(broken_links[:4])}')

    return max(score, 0), issues


def read_skill(skill_dir: Path) -> SkillRecord | None:
    skill_file = skill_dir / 'SKILL.md'
    if not skill_file.exists():
        return None

    content = skill_file.read_text(encoding='utf-8')
    frontmatter, frontmatter_keys, body = parse_frontmatter(content)
    broken_links = find_broken_links(skill_dir, body)
    quality_score, issues = compute_quality(
        skill_dir.name,
        frontmatter,
        frontmatter_keys,
        body,
        broken_links,
    )

    return SkillRecord(
        folder=skill_dir.name,
        skill_dir=skill_dir,
        skill_file=skill_file,
        name=frontmatter.get('name', '').strip(),
        description=frontmatter.get('description', '').strip(),
        frontmatter_keys=frontmatter_keys,
        body=body,
        broken_links=broken_links,
        issues=issues,
        quality_score=quality_score,
    )


def iter_public_skills(repo_root: Path) -> list[SkillRecord]:
    skills_root = repo_root / 'skills'
    records: list[SkillRecord] = []

    for entry in sorted(skills_root.iterdir()):
        if not entry.is_dir():
            continue
        if entry.name.startswith('.') or entry.name == '.system':
            continue
        record = read_skill(entry)
        if record is not None:
            records.append(record)

    return records


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[`*_"]', ' ', text)
    text = re.sub(r'[^0-9a-z\u4e00-\u9fff]+', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def tokenize(text: str) -> set[str]:
    tokens = set(re.findall(r'[0-9a-z\u4e00-\u9fff]+', normalize_text(text)))
    return {token for token in tokens if token not in STOP_WORDS and len(token) > 1}


def jaccard_similarity(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    overlap = left & right
    union = left | right
    return len(overlap) / len(union)


def choose_keep(left: SkillRecord, right: SkillRecord) -> SkillRecord:
    if left.quality_score != right.quality_score:
        return left if left.quality_score > right.quality_score else right
    if len(left.description) != len(right.description):
        return left if len(left.description) > len(right.description) else right
    if len(left.body) != len(right.body):
        return left if len(left.body) > len(right.body) else right
    return left if left.folder < right.folder else right


def detect_duplicates(records: list[SkillRecord]) -> list[dict[str, Any]]:
    duplicates: list[dict[str, Any]] = []

    for index, left in enumerate(records):
        for right in records[index + 1:]:
            left_prefix = left.folder.split('-', 1)[0]
            right_prefix = right.folder.split('-', 1)[0]
            left_name_tokens = tokenize(left.folder)
            right_name_tokens = tokenize(right.folder)
            left_desc_tokens = tokenize(left.description)
            right_desc_tokens = tokenize(right.description)

            name_ratio = SequenceMatcher(None, left.folder, right.folder).ratio()
            desc_ratio = SequenceMatcher(
                None,
                normalize_text(left.description),
                normalize_text(right.description),
            ).ratio()
            name_overlap = jaccard_similarity(left_name_tokens, right_name_tokens)
            desc_overlap = jaccard_similarity(left_desc_tokens, right_desc_tokens)
            shared_prefix = left.folder.startswith(right.folder) or right.folder.startswith(left.folder)
            same_family = left_prefix == right_prefix

            if not (
                (
                    (same_family or shared_prefix or name_overlap >= 0.6)
                    and desc_ratio >= 0.45
                    and desc_overlap >= 0.35
                )
                or (desc_ratio >= 0.90 and desc_overlap >= 0.50)
            ):
                continue

            keep = choose_keep(left, right)
            drop = right if keep is left else left
            confidence = 'high' if desc_ratio >= 0.90 or shared_prefix else 'medium'
            duplicates.append({
                'skills': [left.folder, right.folder],
                'confidence': confidence,
                'reason': (
                    f'name_ratio={name_ratio:.2f}, '
                    f'desc_ratio={desc_ratio:.2f}, '
                    f'name_overlap={name_overlap:.2f}, '
                    f'desc_overlap={desc_overlap:.2f}'
                ),
                'keep': keep.folder,
                'drop': drop.folder,
            })

    return duplicates


def has_marker(text: str, markers: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in markers)


def detect_conflicts(records: list[SkillRecord]) -> list[dict[str, Any]]:
    conflicts: list[dict[str, Any]] = []

    for index, left in enumerate(records):
        left_prefix = left.folder.split('-', 1)[0]
        for right in records[index + 1:]:
            right_prefix = right.folder.split('-', 1)[0]
            shared_prefix = left_prefix == right_prefix
            if not shared_prefix:
                continue

            left_desc = normalize_text(left.description)
            right_desc = normalize_text(right.description)
            if not (
                has_marker(left_desc, EXCLUSIVE_MARKERS)
                or has_marker(right_desc, EXCLUSIVE_MARKERS)
            ):
                continue

            if not (
                has_marker(left_desc, BROAD_SCOPE_MARKERS)
                or has_marker(right_desc, BROAD_SCOPE_MARKERS)
                or has_marker(left_desc, EXCLUSIVE_MARKERS)
                and has_marker(right_desc, EXCLUSIVE_MARKERS)
            ):
                continue

            keep = choose_keep(left, right)
            conflicts.append({
                'skills': [left.folder, right.folder],
                'family': left_prefix,
                'reason': '同一技能家族存在强约束/排他触发语，容易让调度结果互相覆盖',
                'keep': keep.folder,
                'drop': right.folder if keep is left else left.folder,
            })

    return conflicts


def build_report(repo_root: Path) -> dict[str, Any]:
    records = iter_public_skills(repo_root)
    critical_issue_prefixes = ('缺少 frontmatter.', '正文为空')
    low_quality = [
        record.to_summary()
        for record in records
        if record.quality_score <= 70
        or any(issue.startswith(prefix) for prefix in critical_issue_prefixes for issue in record.issues)
    ]
    duplicates = detect_duplicates(records)
    conflicts = detect_conflicts(records)

    recommended_deletions: list[dict[str, Any]] = []
    seen_recommendations: set[str] = set()

    for item in low_quality:
        if item['quality_score'] <= 55:
            recommended_deletions.append({
                'skill': item['skill'],
                'reason': '质量分过低，且存在明显结构性问题',
                'confidence': 'medium',
            })
            seen_recommendations.add(item['skill'])

    for duplicate in duplicates:
        if duplicate['confidence'] == 'high' and duplicate['drop'] not in seen_recommendations:
            recommended_deletions.append({
                'skill': duplicate['drop'],
                'reason': f"高相似度重复，建议保留 {duplicate['keep']}",
                'confidence': 'high',
            })
            seen_recommendations.add(duplicate['drop'])

    return {
        'repo_root': str(repo_root),
        'skill_count': len(records),
        'low_quality_candidates': low_quality,
        'duplicate_candidates': duplicates,
        'conflict_candidates': conflicts,
        'recommended_deletions': recommended_deletions,
    }


def render_text_report(report: dict[str, Any]) -> str:
    lines = [
        f"skills 总数: {report['skill_count']}",
        f"低质量候选: {len(report['low_quality_candidates'])}",
        f"重复候选: {len(report['duplicate_candidates'])}",
        f"冲突候选: {len(report['conflict_candidates'])}",
        '',
    ]

    if report['recommended_deletions']:
        lines.append('建议删除:')
        for item in report['recommended_deletions']:
            lines.append(f"- {item['skill']}: {item['reason']} ({item['confidence']})")
        lines.append('')

    if report['low_quality_candidates']:
        lines.append('低质量候选:')
        for item in report['low_quality_candidates'][:20]:
            reasons = '; '.join(item['issues'])
            lines.append(f"- {item['skill']} [{item['quality_score']}]: {reasons}")
        lines.append('')

    if report['duplicate_candidates']:
        lines.append('重复候选:')
        for item in report['duplicate_candidates'][:20]:
            pair = ' / '.join(item['skills'])
            lines.append(f"- {pair}: keep={item['keep']} drop={item['drop']} ({item['reason']})")
        lines.append('')

    if report['conflict_candidates']:
        lines.append('冲突候选:')
        for item in report['conflict_candidates'][:20]:
            pair = ' / '.join(item['skills'])
            lines.append(f"- {pair}: keep={item['keep']} drop={item['drop']} ({item['reason']})")

    return '\n'.join(lines).rstrip() + '\n'


def parse_existing_summaries(readme_text: str) -> dict[str, str]:
    summaries: dict[str, str] = {}
    inside = False

    for line in readme_text.splitlines():
        if line.startswith(README_SECTION_START):
            inside = True
            continue
        if inside and line.startswith(README_SECTION_END):
            break
        if not inside or not line.startswith('| ['):
            continue

        match = re.match(r'^\| \[([^\]]+)\]\([^)]+\) \| (.+) \|$', line.strip())
        if not match:
            continue

        summaries[match.group(1)] = match.group(2).strip()

    return summaries


def condense_description(description: str) -> str:
    summary = ' '.join(description.split())
    for marker in SUMMARY_SPLIT_PATTERNS:
        if marker in summary:
            summary = summary.split(marker, 1)[0].strip()
    summary = summary.rstrip('，,;；。.')
    if len(summary) > 80:
        summary = summary[:77].rstrip() + '...'
    return summary or '待补充说明。'


def build_skill_table(records: list[SkillRecord], existing_summaries: dict[str, str]) -> str:
    lines = [
        README_SECTION_START,
        '',
        '以下清单按仓库中实际存在的公共 `skills/*/SKILL.md` 整理，不包含 `.system` 内置 skill。名称可直接跳转到对应说明文件。',
        '',
        f'### 公共 Skills（{len(records)}）',
        '',
        '| 名称 | 作用简介 |',
        '|------|----------|',
    ]

    for record in records:
        summary = existing_summaries.get(record.folder)
        generated = False
        if summary in {None, '', '|。', '\\|。', '\\\\|。'}:
            summary = condense_description(record.description)
            generated = True
        if generated:
            summary = summary.replace('|', '\\|')
        lines.append(f'| [{record.folder}]({record.link}) | {summary}。 |' if not summary.endswith('。') else f'| [{record.folder}]({record.link}) | {summary} |')

    return '\n'.join(lines) + '\n'


def sync_readme(repo_root: Path, write: bool, check: bool) -> int:
    readme_path = repo_root / 'README.md'
    existing_text = readme_path.read_text(encoding='utf-8')
    records = iter_public_skills(repo_root)
    summaries = parse_existing_summaries(existing_text)
    skill_section = build_skill_table(records, summaries)

    start = existing_text.find(README_SECTION_START)
    end = existing_text.find(README_SECTION_END)
    if start == -1 or end == -1 or end <= start:
        raise ValueError('README.md 中未找到可替换的 Skill 清单区块')

    new_text = existing_text[:start] + skill_section + '\n' + existing_text[end:]
    is_current = new_text == existing_text

    if check:
        if is_current:
            print('README Skill 清单已是最新状态')
            return 0
        print('README Skill 清单不是最新状态')
        return 1

    if write:
        readme_path.write_text(new_text, encoding='utf-8')
        print(f'已更新 README.md，公共 Skills 数量: {len(records)}')
        return 0

    print(skill_section, end='')
    return 0


def prune_skills(repo_root: Path, skills: list[str], yes: bool) -> int:
    if not yes:
        print('删除前必须显式传入 --yes')
        return 2

    skills_root = (repo_root / 'skills').resolve()
    deleted: list[str] = []
    for skill in skills:
        skill_path = (skills_root / skill).resolve()
        if not skill_path.exists():
            raise FileNotFoundError(f'未找到 skill: {skill}')
        if skill_path.parent != skills_root:
            raise ValueError(f'拒绝删除 skills/ 目录外的路径: {skill_path}')
        if skill_path.name.startswith('.') or skill_path.name == '.system':
            raise ValueError(f'拒绝删除内置或隐藏技能: {skill_path.name}')
        shutil.rmtree(skill_path)
        deleted.append(skill_path.name)

    print('已删除 skills: ' + ', '.join(sorted(deleted)))
    return 0


def command_audit(args: argparse.Namespace) -> int:
    report = build_report(args.repo_root.resolve())
    if args.format == 'json':
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(render_text_report(report), end='')
    return 0


def command_prune(args: argparse.Namespace) -> int:
    return prune_skills(args.repo_root.resolve(), args.skills, args.yes)


def command_sync_readme(args: argparse.Namespace) -> int:
    return sync_readme(args.repo_root.resolve(), args.write, args.check)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description='审计 skills、按明确名单删除，并同步 README.md 的 Skill 清单。',
    )
    subparsers = parser.add_subparsers(dest='command', required=True)

    audit = subparsers.add_parser('audit', help='扫描 skills 目录并输出候选报告')
    audit.add_argument('--repo-root', type=Path, default=Path.cwd())
    audit.add_argument('--format', choices=('text', 'json'), default='text')
    audit.set_defaults(func=command_audit)

    prune = subparsers.add_parser('prune', help='按明确名单删除 skills')
    prune.add_argument('--repo-root', type=Path, default=Path.cwd())
    prune.add_argument('--skills', nargs='+', required=True)
    prune.add_argument('--yes', action='store_true')
    prune.set_defaults(func=command_prune)

    sync = subparsers.add_parser('sync-readme', help='重建 README.md 中的 Skill 清单区块')
    sync.add_argument('--repo-root', type=Path, default=Path.cwd())
    sync.add_argument('--write', action='store_true')
    sync.add_argument('--check', action='store_true')
    sync.set_defaults(func=command_sync_readme)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if getattr(args, 'write', False) and getattr(args, 'check', False):
        parser.error('--write 与 --check 不能同时使用')
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
