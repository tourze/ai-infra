#!/usr/bin/env python3
"""
Cross-platform script to sync AGENTS.md to various AI agents' memory files.
Supports both Windows and Unix-like systems.
"""

import argparse
import os
import sys
from pathlib import Path

# Import shared utilities
from utils import (
    Colors,
    backup_existing,
    files_match,
    get_home_dir,
)


def get_default_targets() -> dict[str, Path]:
    """Get default target paths for different agents."""
    home = get_home_dir()
    return {
        'claude': home / '.claude' / 'CLAUDE.md',
        'codex': home / '.codex' / 'AGENTS.md',
        'gemini': home / '.gemini' / 'GEMINI.md',
    }


def sync_one(label: str, target: Path, source: Path) -> None:
    """Sync source file to target, creating backup if needed."""
    if not source.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Source file does not exist: {source}')
        sys.exit(1)

    # Create parent directory if needed
    target.parent.mkdir(parents=True, exist_ok=True)

    # Check if file already exists and has the same content
    if target.exists():
        try:
            if files_match(source, target):
                msg = f'{Colors.OKCYAN}Already up-to-date [{label}]:{Colors.ENDC} {target}'
                print(msg)
                return
        except Exception as e:
            print(f'{Colors.WARNING}Warning:{Colors.ENDC} Could not compare files: {e}')

    # Backup existing file if it exists
    if target.exists():
        backup_existing(target)

    # Copy the file
    try:
        import shutil
        shutil.copy2(str(source), str(target))
        msg = f'{Colors.OKGREEN}Synced [{label}]:{Colors.ENDC} {target}'
        print(msg)
    except Exception as e:
        msg = f'{Colors.FAIL}Error:{Colors.ENDC} Failed to sync {label}: {e}'
        print(msg)
        sys.exit(1)


def show_help() -> None:
    """Display help information."""
    print(f"""
{Colors.HEADER}Usage:{Colors.ENDC}
  python sync-agent-memory.py              # Sync to claude + codex + gemini
  python sync-agent-memory.py claude       # Sync Claude Code only
  python sync-agent-memory.py codex        # Sync Codex only
  python sync-agent-memory.py gemini       # Sync Gemini CLI only

{Colors.HEADER}Arguments:{Colors.ENDC}
  agent                                    # Agent name (claude, codex, gemini) or omit for all

{Colors.HEADER}Environment Variables:{Colors.ENDC}
  CLAUDE_MEMORY_TARGET=/path/to/CLAUDE.md  # Custom path for Claude Code
  CODEX_HOME=/path/to/codex-home           # Codex home directory
  CODEX_MEMORY_TARGET=/path/to/AGENTS.md   # Custom path for Codex
  GEMINI_MEMORY_TARGET=/path/to/GEMINI.md  # Custom path for Gemini CLI

{Colors.HEADER}Examples:{Colors.ENDC}
  python sync-agent-memory.py              # Sync to all agents
  python sync-agent-memory.py gemini       # Sync only Gemini
""")


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Sync AGENTS.md to various AI agents',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        'agent',
        nargs='?',
        choices=['claude', 'codex', 'gemini', 'all'],
        default='all',
        help='Agent to sync (default: all)'
    )
    parser.add_argument(
        '--source',
        type=Path,
        default=None,
        help='Source AGENTS.md file (default: ../AGENTS.md)'
    )

    args = parser.parse_args()

    # Determine source file
    if args.source:
        source_file = args.source
    else:
        # Default to ../AGENTS.md relative to script location
        script_dir = Path(__file__).parent
        source_file = script_dir.parent / 'AGENTS.md'

    source_file = source_file.resolve()

    if not source_file.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Source file does not exist: {source_file}')
        return 1

    # Get target paths from environment or defaults
    targets = get_default_targets()

    # Override with environment variables if set
    # Note: CODEX_MEMORY_TARGET takes precedence over CODEX_HOME
    if os.environ.get('CLAUDE_MEMORY_TARGET'):
        targets['claude'] = Path(os.environ['CLAUDE_MEMORY_TARGET'])

    if os.environ.get('CODEX_MEMORY_TARGET'):
        targets['codex'] = Path(os.environ['CODEX_MEMORY_TARGET'])
    elif os.environ.get('CODEX_HOME'):
        targets['codex'] = Path(os.environ['CODEX_HOME']) / 'AGENTS.md'

    if os.environ.get('GEMINI_MEMORY_TARGET'):
        targets['gemini'] = Path(os.environ['GEMINI_MEMORY_TARGET'])

    # Sync based on agent argument
    agent = args.agent.lower()

    # Define agents and their order
    agents = ['claude', 'codex', 'gemini']

    if agent == 'all':
        for agent_key in agents:
            sync_one(agent_key, targets[agent_key], source_file)
    elif agent in agents:
        sync_one(agent, targets[agent], source_file)

    return 0


if __name__ == '__main__':
    sys.exit(main())
