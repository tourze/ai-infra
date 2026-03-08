#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="${ROOT_DIR}/skills"

CC_TARGET="${CC_TARGET:-$HOME/.claude/skills}"
CODEX_TARGET="${CODEX_TARGET:-$HOME/.codex/skills}"

usage() {
  cat <<'EOF'
用法:
  bash ./scripts/link-skills.sh           # 同时链接 cc + codex
  bash ./scripts/link-skills.sh cc        # 仅链接 cc
  bash ./scripts/link-skills.sh codex     # 仅链接 codex

可选环境变量:
  CC_TARGET=/path/to/cc/skills
  CODEX_TARGET=/path/to/codex/skills
EOF
}

backup_existing() {
  local target="$1"
  local ts backup
  ts="$(date +%Y%m%d%H%M%S)"
  backup="${target}.bak.${ts}"
  mv "$target" "$backup"
  echo "已备份: $target -> $backup"
}

link_one() {
  local label="$1"
  local target="$2"
  local parent
  parent="$(dirname "$target")"
  mkdir -p "$parent"

  if [[ -L "$target" ]]; then
    rm "$target"
    ln -s "$SRC_DIR" "$target"
    echo "已更新软链 [$label]: $target -> $SRC_DIR"
    return
  fi

  if [[ -e "$target" ]]; then
    backup_existing "$target"
  fi

  ln -s "$SRC_DIR" "$target"
  echo "已创建软链 [$label]: $target -> $SRC_DIR"
}

if [[ ! -d "$SRC_DIR" ]]; then
  echo "错误: 源目录不存在: $SRC_DIR" >&2
  exit 1
fi

case "${1:-all}" in
  all)
    link_one "cc" "$CC_TARGET"
    link_one "codex" "$CODEX_TARGET"
    ;;
  cc)
    link_one "cc" "$CC_TARGET"
    ;;
  codex)
    link_one "codex" "$CODEX_TARGET"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "错误: 不支持的参数 '$1'" >&2
    usage
    exit 1
    ;;
esac
