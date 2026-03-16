#!/usr/bin/env node
/**
 * Smoke test Claude hooks using Node.js implementations.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { Colors, runCommand } = require('./utils');

function runHook(hookPath, payload) {
  return runCommand(process.execPath, [hookPath], {
    input: JSON.stringify(payload),
    timeout: 10000,
  });
}

function assertContains(output, needle) {
  if (!output.includes(needle)) {
    throw new Error(`Assertion failed: "${needle}" not found in output`);
  }
}

function testForceThink(hookDir) {
  const hookPath = path.join(hookDir, 'force-think.js');
  if (!fs.existsSync(hookPath)) {
    throw new Error(`Hook not found: ${hookPath}`);
  }

  const firstResult = runHook(hookPath, { prompt: '请分析这个问题' });
  assert.equal(firstResult.status, 0, firstResult.stderr || firstResult.stdout);
  if (
    !firstResult.stdout.includes('additionalContext') &&
    !firstResult.stdout.includes('hookEventName')
  ) {
    throw new Error('force-think: Expected additionalContext or hookEventName in output');
  }

  const secondResult = runHook(hookPath, { prompt: 'please think harder' });
  assert.equal(secondResult.status, 0, secondResult.stderr || secondResult.stdout);
  const output = secondResult.stdout.trim();
  if (output && !output.startsWith('#') && !output.startsWith(';')) {
    throw new Error(`force-think: unexpected output for think prompt: ${output}`);
  }
}

function testProtectWorktree(hookDir) {
  const hookPath = path.join(hookDir, 'protect-worktree.js');
  if (!fs.existsSync(hookPath)) {
    throw new Error(`Hook not found: ${hookPath}`);
  }

  const blocked = runHook(hookPath, {
    tool_name: 'Bash',
    tool_input: { command: 'git reset --hard' },
  });
  assert.equal(blocked.status, 2, blocked.stderr || blocked.stdout);
  assertContains(blocked.stdout, '"decision": "block"');

  const safe = runHook(hookPath, {
    tool_name: 'Bash',
    tool_input: { command: 'git status --short' },
  });
  assert.equal(safe.status, 0, safe.stderr || safe.stdout);
  const output = safe.stdout.trim();
  if (output && !output.startsWith('#') && !output.startsWith(';')) {
    throw new Error(`protect-worktree: unexpected output for safe command: ${output}`);
  }
}

function main() {
  const hookDir = path.join(__dirname, '..', '.claude', 'hooks');
  if (!fs.existsSync(hookDir)) {
    console.error(`${Colors.FAIL}Error:${Colors.ENDC} Hook directory not found: ${hookDir}`);
    return 1;
  }

  try {
    testForceThink(hookDir);
    testProtectWorktree(hookDir);
    console.log(`${Colors.OKGREEN}claude hook smoke test passed${Colors.ENDC}`);
    return 0;
  } catch (error) {
    console.error(`${Colors.FAIL}Test failed:${Colors.ENDC} ${error.message}`);
    return 1;
  }
}

process.exit(main());
