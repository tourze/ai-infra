#!/usr/bin/env python3
"""
Cross-platform script to sync AGENTS.md to various AI agents' memory files.
Supports both Windows and Unix-like systems.
"""

import argparse
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

# ANSI color codes
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'

if sys.platform == 'win32':
    try:
        import colorama
        colorama.init()
    except ImportError:
        if not sys.stdout.isatty():
            Colors.disable()


def get_home_dir() -> Path:
    """Get the user's home directory."""
    return Path.home()


def get_default_targets() -> dict:
    """Get default target paths for different agents."""
    home = get_home_dir()
    return {
        'claude': home / '.claude' / 'CLAUDE.md',
        'codex': home / '.codex' / 'AGENTS.md',
        'gemini': home / '.gemini' / 'GEMINI.md',
    }


def backup_existing(target: Path) -> None:
    """Backup existing file by moving it with a timestamp suffix."""
    if not target.exists():
        return

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    backup = Path(f'{target}.bak.{timestamp}')

    try:
        shutil.move(str(target), str(backup))
        print(f'{Colors.OKGREEN}Backup created:{Colors.ENDC} {target} -> {backup}')
    except Exception as e:
        print(f'{Colors.WARNING}Warning:{Colors.ENDC} Could not backup {target}: {e}')
        raise


def get_file_hash(filepath: Path) -> str:
    """Calculate SHA256 hash of a file."""
    import hashlib
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


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
            source_hash = get_file_hash(source)
            target_hash = get_file_hash(target)

            if source_hash == target_hash:
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

    if agent == 'all':
        sync_one('claude', targets['claude'], source_file)
        sync_one('codex', targets['codex'], source_file)
        sync_one('gemini', targets['gemini'], source_file)
    elif agent == 'claude':
        sync_one('claude', targets['claude'], source_file)
    elif agent == 'codex':
        sync_one('codex', targets['codex'], source_file)
    elif agent == 'gemini':
        sync_one('gemini', targets['gemini'], source_file)

    return 0


if __name__ == '__main__':
    sys.exit(main())
