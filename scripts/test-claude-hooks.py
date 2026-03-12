#!/usr/bin/env python3
"""Cross-platform test script for Claude hooks."""

import json
import subprocess
import sys
from pathlib import Path

# Import shared utilities
from utils import Colors


def assert_contains(output: str, needle: str) -> None:
    """Assert that needle is contained in haystack."""
    if needle not in output:
        raise AssertionError(f'Assertion failed: "{needle}" not found in output')


def test_force_think(hook_dir: Path) -> None:
    """Test the force-think hook."""
    hook_path = hook_dir / 'force-think.py'

    if not hook_path.exists():
        raise AssertionError(f'Hook not found: {hook_path}')

    # Test 1: Prompt with Chinese should append context
    input_data = json.dumps({'prompt': '请分析这个问题'})
    result = subprocess.run(
        [sys.executable, str(hook_path)],
        input=input_data,
        capture_output=True,
        text=True,
        timeout=10
    )

    output = result.stdout
    # Check for JSON structure (may have encoding issues on Windows)
    if 'additionalContext' not in output and 'hookEventName' not in output:
        if not ('{' in output and '}' in output):
            raise AssertionError('force-think: Expected additionalContext or JSON in output')

    # Test 2: Prompt containing 'think' should not append
    input_data = json.dumps({'prompt': 'please think harder'})
    result = subprocess.run(
        [sys.executable, str(hook_path)],
        input=input_data,
        capture_output=True,
        text=True,
        timeout=10
    )

    output = result.stdout.strip()
    if output and not output.isspace():
        if not output.startswith('#') and not output.startswith(';'):
            raise AssertionError(
                f"force-think: prompt containing 'think' should not append context. "
                f'Output: {output}'
            )


def test_protect_worktree(hook_dir: Path) -> None:
    """Test the protect-worktree hook."""
    hook_path = hook_dir / 'protect-worktree.py'

    if not hook_path.exists():
        raise AssertionError(f'Hook not found: {hook_path}')

    # Test 1: git reset --hard should be blocked
    input_data = json.dumps({
        'tool_name': 'Bash',
        'tool_input': {'command': 'git reset --hard'}
    })
    result = subprocess.run(
        [sys.executable, str(hook_path)],
        input=input_data,
        capture_output=True,
        text=True,
        timeout=10
    )

    if result.returncode != 2:
        raise AssertionError(
            f"protect-worktree: git reset --hard should be blocked, "
            f'got exit code {result.returncode}'
        )

    assert_contains(result.stdout, '"decision": "block"')

    # Test 2: Safe commands should not produce blocking output
    input_data = json.dumps({
        'tool_name': 'Bash',
        'tool_input': {'command': 'git status --short'}
    })
    result = subprocess.run(
        [sys.executable, str(hook_path)],
        input=input_data,
        capture_output=True,
        text=True,
        timeout=10
    )

    output = result.stdout.strip()
    if output and not output.isspace():
        if not output.startswith('#') and not output.startswith(';'):
            raise AssertionError(
                f'protect-worktree: safe commands should not produce blocking output. '
                f'Output: {output}'
            )


def main() -> int:
    """Main entry point."""
    script_dir = Path(__file__).parent
    root_dir = script_dir.parent
    hook_dir = root_dir / '.claude' / 'hooks'

    if not hook_dir.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Hook directory not found: {hook_dir}')
        return 1

    try:
        test_force_think(hook_dir)
        test_protect_worktree(hook_dir)
        print(f'{Colors.OKGREEN}claude hook smoke test passed{Colors.ENDC}')
        return 0
    except AssertionError as e:
        print(f'{Colors.FAIL}Test failed:{Colors.ENDC} {e}')
        return 1
    except Exception as e:
        print(f'{Colors.FAIL}Test error:{Colors.ENDC} {e}')
        return 1


if __name__ == '__main__':
    sys.exit(main())
