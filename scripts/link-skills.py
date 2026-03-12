#!/usr/bin/env python3
"""
Cross-platform script to create symbolic links from skills directory to various AI agents.
Supports both Windows (using junctions) and Unix-like systems (using symlinks).
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

# Import shared utilities
from utils import (
    Colors,
    IS_WINDOWS,
    backup_existing,
    get_home_dir,
    is_junction,
)


def get_default_paths() -> dict[str, Path]:
    """Get default target paths for different agents."""
    home = get_home_dir()
    return {
        'cc': home / '.claude' / 'skills',
        'codex': home / '.codex' / 'skills',
        'gemini': home / '.gemini' / 'skills',
    }


def create_symlink(source: Path, target: Path, label: str) -> None:
    """Create a symbolic link (or junction on Windows) from source to target."""
    if not source.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Source directory does not exist: {source}')
        sys.exit(1)

    target.parent.mkdir(parents=True, exist_ok=True)

    # Check if target is already a symlink
    if target.is_symlink() or (IS_WINDOWS and is_junction(target)):
        try:
            # Remove old symlink and create new one
            target.unlink()
            _create_link(source, target)
            msg = f'{Colors.OKGREEN}Updated symlink [{label}]:{Colors.ENDC} {target} -> {source}'
            print(msg)
            return
        except Exception as e:
            msg = f'{Colors.WARNING}Warning:{Colors.ENDC} Could not update symlink: {e}'
            print(msg)

    # If target exists (not a symlink), backup first
    if target.exists():
        backup_existing(target)

    # Create the symlink
    try:
        _create_link(source, target)
        msg = f'{Colors.OKGREEN}Created symlink [{label}]:{Colors.ENDC} {target} -> {source}'
        print(msg)
    except Exception as e:
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Failed to create symlink: {e}')
        if IS_WINDOWS:
            print(f'{Colors.WARNING}Tip:{Colors.ENDC} On Windows, creating symlinks requires:')
            print(f'  1. Developer Mode enabled, OR')
            print(f'  2. Running PowerShell as Administrator')
            print(f'{Colors.OKCYAN}Falling back to directory junction...{Colors.ENDC}')
            try:
                _create_windows_junction(source, target)
                msg = f'{Colors.OKGREEN}Created junction [{label}]:{Colors.ENDC} {target} -> {source}'
                print(msg)
            except Exception as e2:
                print(f'{Colors.FAIL}Error:{Colors.ENDC} Failed to create junction: {e2}')
                sys.exit(1)
        else:
            sys.exit(1)


def _create_link(source: Path, target: Path) -> None:
    """Internal function to create the appropriate link type for the platform."""
    if IS_WINDOWS:
        # On Windows, try symlink first
        os.symlink(str(source), str(target), target_is_directory=True)
    else:
        # On Unix, use standard symlink
        os.symlink(str(source), str(target), target_is_directory=True)


def _create_windows_junction(source: Path, target: Path) -> None:
    """Create a directory junction on Windows using subprocess."""
    # Ensure source is absolute path
    source = source.resolve()
    target = target.resolve()

    # Don't create target directory, mklink will do it
    # Use mklink command
    cmd = f'mklink /J "{target}" "{source}"'
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise subprocess.CalledProcessError(
            result.returncode,
            cmd,
            result.stdout,
            result.stderr
        )


def link_one(label: str, target: Path, source: Path) -> None:
    """Create symlink for one agent."""
    create_symlink(source, target, label)


def show_help() -> None:
    """Display help information."""
    print(f"""
{Colors.HEADER}Usage:{Colors.ENDC}
  python link-skills.py                    # Link cc + codex + gemini
  python link-skills.py cc                 # Link cc only
  python link-skills.py codex              # Link codex only
  python link-skills.py gemini             # Link Gemini CLI only

{Colors.HEADER}Arguments:{Colors.ENDC}
  agent                                    # Agent name (cc, codex, gemini) or omit for all

{Colors.HEADER}Environment Variables:{Colors.ENDC}
  CC_TARGET=/path/to/cc/skills             # Custom path for Claude Code
  CODEX_TARGET=/path/to/codex/skills       # Custom path for Codex
  GEMINI_TARGET=/path/to/gemini/skills     # Custom path for Gemini CLI

{Colors.HEADER}Examples:{Colors.ENDC}
  python link-skills.py                    # Link all agents
  python link-skills.py gemini             # Link only Gemini
  CC_TARGET=/custom/path python link-skills.py cc  # Use custom path
""")


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Link skills directory to various AI agents',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        'agent',
        nargs='?',
        choices=['cc', 'codex', 'gemini', 'all'],
        default='all',
        help='Agent to link (default: all)'
    )
    parser.add_argument(
        '--source',
        type=Path,
        default=None,
        help='Source skills directory (default: ../skills)'
    )

    args = parser.parse_args()

    # Determine source directory
    if args.source:
        source_dir = args.source
    else:
        # Default to ../skills relative to script location
        script_dir = Path(__file__).parent
        source_dir = script_dir.parent / 'skills'

    source_dir = source_dir.resolve()

    if not source_dir.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Source directory does not exist: {source_dir}')
        return 1

    # Get target paths from environment or defaults
    paths = get_default_paths()

    # Override with environment variables if set
    env_mappings = {
        'CC_TARGET': 'cc',
        'CODEX_TARGET': 'codex',
        'GEMINI_TARGET': 'gemini',
    }
    for env_var, agent_key in env_mappings.items():
        if os.environ.get(env_var):
            paths[agent_key] = Path(os.environ[env_var])

    # Link based on agent argument
    agent = args.agent.lower()

    # Define agents and their order
    agents = ['cc', 'codex', 'gemini']

    if agent == 'all':
        for agent_key in agents:
            link_one(agent_key, paths[agent_key], source_dir)
    elif agent in agents:
        link_one(agent, paths[agent], source_dir)

    return 0


if __name__ == '__main__':
    sys.exit(main())
