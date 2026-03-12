#!/usr/bin/env python3
"""Cross-platform test script for link-skills.py."""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

# Import shared utilities
from utils import Colors, is_link_or_junction


def assert_symlink_target(target: Path, expected_source: Path) -> None:
    """
    Assert that target is a symlink or junction pointing to expected_source.

    Uses os.readlink() to detect both symlinks and junctions on Windows.
    """
    if not target.exists() and not is_link_or_junction(target):
        raise AssertionError(f'Missing symlink: {target}')

    # Check if it's a symlink or junction
    if not is_link_or_junction(target):
        raise AssertionError(f'Not a symlink or junction: {target}')

    # Resolve and compare
    try:
        resolved = target.resolve()
        expected = expected_source.resolve()

        if resolved != expected:
            raise AssertionError(
                f'Symlink target incorrect: {target} -> {resolved} '
                f'(expected: {expected})'
            )
    except Exception as e:
        raise AssertionError(f'Failed to resolve symlink: {e}')


def assert_not_exists(target: Path) -> None:
    """Assert that target does not exist."""
    if target.exists() or is_link_or_junction(target):
        raise AssertionError(f'Target should not exist: {target}')


def test_default_mode(script_path: Path, source_dir: Path) -> None:
    """Test linking all agents (default mode)."""
    with tempfile.TemporaryDirectory(prefix='test-link-skills-') as temp_home:
        home_key = 'USERPROFILE' if sys.platform == 'win32' else 'HOME'
        old_home = os.environ.get(home_key)

        try:
            os.environ[home_key] = temp_home

            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                timeout=30,
                env=os.environ.copy()
            )

            if result.returncode != 0:
                raise AssertionError(
                    f'link-skills.py failed: {result.stderr}\n{result.stdout}'
                )

            home = Path(temp_home)
            cc_target = home / '.claude' / 'skills'
            codex_target = home / '.codex' / 'skills'
            gemini_target = home / '.gemini' / 'skills'

            assert_symlink_target(cc_target, source_dir)
            assert_symlink_target(codex_target, source_dir)
            assert_symlink_target(gemini_target, source_dir)

        finally:
            if old_home:
                os.environ[home_key] = old_home
            elif home_key in os.environ:
                del os.environ[home_key]


def test_gemini_only(script_path: Path, source_dir: Path) -> None:
    """Test linking only Gemini."""
    with tempfile.TemporaryDirectory(prefix='test-link-skills-gemini-') as temp_home:
        home_key = 'USERPROFILE' if sys.platform == 'win32' else 'HOME'
        old_home = os.environ.get(home_key)

        try:
            os.environ[home_key] = temp_home

            result = subprocess.run(
                [sys.executable, str(script_path), 'gemini'],
                capture_output=True,
                text=True,
                timeout=30,
                env=os.environ.copy()
            )

            if result.returncode != 0:
                raise AssertionError(
                    f'link-skills.py gemini failed: {result.stderr}\n{result.stdout}'
                )

            home = Path(temp_home)
            cc_target = home / '.claude' / 'skills'
            codex_target = home / '.codex' / 'skills'
            gemini_target = home / '.gemini' / 'skills'

            assert_not_exists(cc_target)
            assert_not_exists(codex_target)
            assert_symlink_target(gemini_target, source_dir)

        finally:
            if old_home:
                os.environ[home_key] = old_home
            elif home_key in os.environ:
                del os.environ[home_key]


def main() -> int:
    """Main entry point."""
    script_dir = Path(__file__).parent
    script_path = script_dir / 'link-skills.py'
    source_dir = script_dir.parent / 'skills'

    if not script_path.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} link-skills.py not found at {script_path}')
        return 1

    if not source_dir.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Source directory not found: {source_dir}')
        return 1

    try:
        test_default_mode(script_path, source_dir)
        test_gemini_only(script_path, source_dir)
        print(f'{Colors.OKGREEN}link:skills smoke test passed{Colors.ENDC}')
        return 0
    except AssertionError as e:
        print(f'{Colors.FAIL}Test failed:{Colors.ENDC} {e}')
        return 1
    except Exception as e:
        print(f'{Colors.FAIL}Test error:{Colors.ENDC} {e}')
        return 1


if __name__ == '__main__':
    sys.exit(main())
