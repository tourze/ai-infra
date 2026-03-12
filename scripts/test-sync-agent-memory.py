#!/usr/bin/env python3
"""Cross-platform test script for sync-agent-memory.py."""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

# Import shared utilities
from utils import Colors, files_match


def assert_same_file(file1: Path, file2: Path) -> None:
    """Assert that two files have the same content."""
    if not file1.exists():
        raise AssertionError(f'File does not exist: {file1}')
    if not file2.exists():
        raise AssertionError(f'File does not exist: {file2}')

    if not files_match(file1, file2):
        raise AssertionError(f'Content mismatch: {file1} != {file2}')


def main() -> int:
    """Main entry point."""
    script_dir = Path(__file__).parent
    script_path = script_dir / 'sync-agent-memory.py'
    source_file = script_dir.parent / 'AGENTS.md'

    if not script_path.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} sync-agent-memory.py not found at {script_path}')
        return 1

    if not source_file.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Source file not found: {source_file}')
        return 1

    with tempfile.TemporaryDirectory(prefix='test-sync-memory-') as temp_home:
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
                    f'sync-agent-memory.py failed: {result.stderr}\n{result.stdout}'
                )

            home = Path(temp_home)
            claude_target = home / '.claude' / 'CLAUDE.md'
            codex_target = home / '.codex' / 'AGENTS.md'
            gemini_target = home / '.gemini' / 'GEMINI.md'

            assert_same_file(source_file, claude_target)
            assert_same_file(source_file, codex_target)
            assert_same_file(source_file, gemini_target)

            print(f'{Colors.OKGREEN}sync:memory smoke test passed{Colors.ENDC}')
            return 0

        except AssertionError as e:
            print(f'{Colors.FAIL}Test failed:{Colors.ENDC} {e}')
            return 1
        except Exception as e:
            print(f'{Colors.FAIL}Test error:{Colors.ENDC} {e}')
            return 1
        finally:
            if old_home:
                os.environ[home_key] = old_home
            elif home_key in os.environ:
                del os.environ[home_key]


if __name__ == '__main__':
    sys.exit(main())
