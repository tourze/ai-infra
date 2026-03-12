#!/usr/bin/env python3
"""
Cross-platform script to run repository quality gate tests.
Runs all test scripts and reports results.
"""

import sys
from pathlib import Path

# Import shared utilities
from utils import Colors


def run_test(script_name: str, script_dir: Path) -> bool:
    """Run a test script and return True if it passes."""
    script_path = script_dir / script_name

    if not script_path.exists():
        print(f'{Colors.FAIL}Error:{Colors.ENDC} Test script not found: {script_path}')
        return False

    print(f'{Colors.OKCYAN}Running {script_name}...{Colors.ENDC}')

    try:
        import subprocess
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            print(f'{Colors.OKGREEN}PASS{Colors.ENDC} {script_name}')
            return True
        else:
            print(f'{Colors.FAIL}FAIL{Colors.ENDC} {script_name}')
            if result.stdout:
                print(f'{Colors.WARNING}stdout:{Colors.ENDC} {result.stdout}')
            if result.stderr:
                print(f'{Colors.WARNING}stderr:{Colors.ENDC} {result.stderr}')
            return False
    except subprocess.TimeoutExpired:
        print(f'{Colors.FAIL}TIMEOUT{Colors.ENDC} {script_name}')
        return False
    except Exception as e:
        print(f'{Colors.FAIL}ERROR{Colors.ENDC} {script_name}: {e}')
        return False


def main() -> int:
    """Main entry point."""
    script_dir = Path(__file__).parent

    print(f'{Colors.BOLD}{Colors.HEADER}Running repository quality gate tests...{Colors.ENDC}')
    print()

    tests = [
        'test-link-skills.py',
        'test-sync-agent-memory.py',
        'test-claude-hooks.py',
    ]

    results = {}
    for test in tests:
        results[test] = run_test(test, script_dir)
        print()

    # Summary
    print(f'{Colors.BOLD}Test Summary:{Colors.ENDC}')
    all_passed = True
    for test, passed in results.items():
        status = f'{Colors.OKGREEN}PASS{Colors.ENDC}' if passed else f'{Colors.FAIL}FAIL{Colors.ENDC}'
        print(f'  {test}: {status}')
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print(f'{Colors.OKGREEN}{Colors.BOLD}repo validation passed{Colors.ENDC}')
        return 0
    else:
        print(f'{Colors.FAIL}{Colors.BOLD}repo validation failed{Colors.ENDC}')
        return 1


if __name__ == '__main__':
    sys.exit(main())
