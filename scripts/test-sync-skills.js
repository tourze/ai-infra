#!/usr/bin/env node
/**
 * Smoke test sync-skills.js command parsing and help output.
 */

const assert = require('node:assert/strict');
const path = require('node:path');

const { Colors, runCommand } = require('./utils');

function main() {
  const scriptPath = path.join(__dirname, '..', 'sync-skills.js');

  try {
    const helpResult = runCommand(process.execPath, [scriptPath, '--help'], {
      timeout: 10000,
    });
    assert.equal(helpResult.status, 0, helpResult.stderr || helpResult.stdout);
    assert.match(helpResult.stdout, /sync:skills/);

    const invalidResult = runCommand(process.execPath, [scriptPath, '--unknown'], {
      timeout: 10000,
    });
    assert.notEqual(invalidResult.status, 0, 'unknown option should fail');
    assert.match(
      `${invalidResult.stdout}${invalidResult.stderr}`,
      /Unknown option|初始化失败/,
    );

    console.log(`${Colors.OKGREEN}sync:skills smoke test passed${Colors.ENDC}`);
    return 0;
  } catch (error) {
    console.error(`${Colors.FAIL}Test failed:${Colors.ENDC} ${error.message}`);
    return 1;
  }
}

process.exit(main());
