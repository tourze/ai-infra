#!/usr/bin/env python3
"""
Cross-platform script to create symbolic links from skills directory to various AI agents.
Supports both Windows (using junctions) and Unix-like systems (using symlinks).
"""

import argparse
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# ANSI color codes for terminal output
class Colors:
    """ANSI color codes for cross-platform terminal output."""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

    @staticmethod
    def disable():
        """Disable colors if not in a terminal."""
        Colors.HEADER = ''
        Colors.OKBLUE = ''
        Colors.OKCYAN = ''
        Colors.OKGREEN = ''
        Colors.WARNING = ''
        Colors.FAIL = ''
        Colors.ENDC = ''
        Colors.BOLD = ''
        Colors.UNDERLINE = ''

# Disable colors on Windows if not supported
if sys.platform == 'win32':
    try:
        import colorama
        colorama.init()
    except ImportError:
        # Check if we're in a terminal that supports ANSI
        if not sys.stdout.isatty():
            Colors.disable()

# Platform detection
IS_WINDOWS = sys.platform == 'win32'


def get_home_dir() -> Path:
    """Get the user's home directory in a cross-platform way."""
    return Path.home()


def get_default_paths() -> dict:
    """Get default target paths for different agents."""
    home = get_home_dir()
    return {
        'cc': home / '.claude' / 'skills',
        'codex': home / '.codex' / 'skills',
        'gemini': home / '.gemini' / 'skills',
    }


def backup_existing(target: Path) -> None:
    """Backup existing file/directory by moving it with a timestamp suffix."""
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


def is_junction(path: Path) -> bool:
    """
    Check if a path is a junction on Windows.

    Note: From Python 3.8+, pathlib.Path.is_symlink() correctly
    identifies junctions on Windows, so we can rely on it.
    """
    if not IS_WINDOWS:
        return False
    # is_symlink() returns True for both symlinks and junctions on Windows (Python 3.8+)
    return path.is_symlink()


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
    if os.environ.get('CC_TARGET'):
        paths['cc'] = Path(os.environ['CC_TARGET'])
    if os.environ.get('CODEX_TARGET'):
        paths['codex'] = Path(os.environ['CODEX_TARGET'])
    if os.environ.get('GEMINI_TARGET'):
        paths['gemini'] = Path(os.environ['GEMINI_TARGET'])

    # Link based on agent argument
    agent = args.agent.lower()

    if agent == 'all':
        link_one('cc', paths['cc'], source_dir)
        link_one('codex', paths['codex'], source_dir)
        link_one('gemini', paths['gemini'], source_dir)
    elif agent == 'cc':
        link_one('cc', paths['cc'], source_dir)
    elif agent == 'codex':
        link_one('codex', paths['codex'], source_dir)
    elif agent == 'gemini':
        link_one('gemini', paths['gemini'], source_dir)

    return 0


if __name__ == '__main__':
    sys.exit(main())
