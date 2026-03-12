#!/usr/bin/env python3
"""
Shared utility functions for ai-infra scripts.
Provides common functionality for cross-platform compatibility, colors, and file operations.
"""

import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


class Colors:
    """ANSI color codes for terminal output."""

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


def init_colors():
    """Initialize colors for the current platform."""
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
IS_MACOS = sys.platform == 'darwin'
IS_LINUX = sys.platform.startswith('linux')


def get_home_dir() -> Path:
    """
    Get the user's home directory in a cross-platform way.

    Returns:
        Path to the user's home directory
    """
    return Path.home()


def backup_existing(target: Path) -> None:
    """
    Backup existing file/directory by moving it with a timestamp suffix.

    Args:
        target: Path to the file/directory to backup

    Raises:
        Exception: If backup fails
    """
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
    """
    Calculate SHA256 hash of a file.

    Args:
        filepath: Path to the file to hash

    Returns:
        SHA256 hash as a hexadecimal string
    """
    import hashlib
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def run_command(
    command: list[str],
    cwd: Path | None = None,
    capture_output: bool = True,
    timeout: int | None = None,
) -> subprocess.CompletedProcess:
    """
    Run a command and return the result.

    Args:
        command: Command to run as a list of strings
        cwd: Working directory for the command
        capture_output: Whether to capture stdout and stderr
        timeout: Timeout in seconds

    Returns:
        CompletedProcess object with the result
    """
    return subprocess.run(
        command,
        capture_output=capture_output,
        text=True,
        cwd=str(cwd) if cwd else None,
        timeout=timeout,
    )


def files_match(file1: Path, file2: Path) -> bool:
    """
    Check if two files have the same content using SHA256 hash.

    Args:
        file1: First file path
        file2: Second file path

    Returns:
        True if files have the same content, False otherwise
    """
    if not file1.exists() or not file2.exists():
        return False

    try:
        return get_file_hash(file1) == get_file_hash(file2)
    except Exception:
        return False


def is_junction(path: Path) -> bool:
    """
    Check if a path is a junction on Windows.

    Note: From Python 3.8+, pathlib.Path.is_symlink() correctly
    identifies junctions on Windows, so we rely on it.

    Args:
        path: Path to check

    Returns:
        True if path is a junction, False otherwise
    """
    if not IS_WINDOWS:
        return False
    # is_symlink() returns True for both symlinks and junctions on Windows (Python 3.8+)
    return path.is_symlink()


def get_env_path(env_var: str, default: Path) -> Path:
    """
    Get a path from environment variable or return default.

    Args:
        env_var: Environment variable name
        default: Default path if env var is not set

    Returns:
        Path from environment or default
    """
    if os.environ.get(env_var):
        return Path(os.environ[env_var])
    return default


# Initialize colors when module is imported
init_colors()
