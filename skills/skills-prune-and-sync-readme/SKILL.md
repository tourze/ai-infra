---
name: skills-prune-and-sync-readme
description: 遍历当前仓库的 `skills/` 目录，依据证据定位低质量、重复或触发冲突的 skill，按明确名单删除目标目录，并重建 `README.md` 中的 Skill 清单。用户提到“清理 skills”“删除重复/低质量 skill”“治理 skill 冲突”“更新 README 的 skill 列表”时使用。
---

# Skills Prune And Sync README

使用仓库内置脚本 `scripts/curate_skills.py` 完成审计、删除和 README 同步，不要手工逐个维护 `README.md` 表格。

## 工作流

1. 先跑审计，输出证据。

```bash
python3 skills/skills-prune-and-sync-readme/scripts/curate_skills.py audit --repo-root .
```

2. 只在用户明确要求删除时，按名单删除；不要基于模糊相似度直接批量删除。

```bash
python3 skills/skills-prune-and-sync-readme/scripts/curate_skills.py prune --repo-root . --skills skill-a skill-b --yes
```

3. 删除后重建 `README.md` 的 Skill 清单区块。

```bash
python3 skills/skills-prune-and-sync-readme/scripts/curate_skills.py sync-readme --repo-root . --write
```

4. 最后校验 README 是否已同步。

```bash
python3 skills/skills-prune-and-sync-readme/scripts/curate_skills.py sync-readme --repo-root . --check
```

## 判定准则

- 低质量：缺少 `name`/`description`、正文明显过短、包含 `TODO`/`TBD`、相对链接失效、frontmatter 明显漂移。
- 重复：名称与描述高度相似，且目标能力基本重叠。
- 冲突：同一技能家族内存在 “MUST/ALWAYS/ONLY/必须/仅限” 一类强约束触发语，导致调度边界互相覆盖。

## 删除规则

- 优先保留触发边界更清晰、质量分更高、资源更完整的 skill。
- 专项子技能不是重复。父技能 + 子技能的关系，默认视为家族分层，不自动删除。
- `.system` 下的内置 skill 不在删除范围，除非用户单独点名。
- 如果报告只有“候选”没有高置信建议，先把证据和保留/删除理由发给用户，再执行删除。

## README 规则

- 只更新 `README.md` 中 `## Skill 清单` 到 `## 数据来源` 之间的区块。
- 现有表格里的摘要优先保留；新增 skill 才从 `description` 自动生成摘要。
- 不要手工改技能数量统计，统一交给 `sync-readme` 子命令。
