#!/usr/bin/env node
/**
 * Smoke test hooks/dispatch.mjs — 验证 dispatcher 能正确路由并执行 hook。
 */

const assert = require('node:assert/strict');
const path = require('node:path');

const { Colors, runCommand } = require('./utils');

const dispatchScript = path.join(__dirname, '..', 'hooks', 'dispatch.mjs');

function runDispatch(subdir, payload) {
  return runCommand(process.execPath, [dispatchScript, subdir], {
    input: JSON.stringify(payload),
    timeout: 10000,
  });
}

function testPreBashBlock() {
  // dangerous-command-guard 应拦截 git reset --hard
  const result = runDispatch('pre-tool-use/bash', {
    tool_input: { command: 'git reset --hard HEAD' },
  });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout.trim());
  assert.equal(output.decision, 'block');
  assert.match(output.reason, /Dangerous Command/);
}

function testPreBashPass() {
  // 安全命令不应被拦截
  const result = runDispatch('pre-tool-use/bash', {
    tool_input: { command: 'git status --short' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '', 'safe command should produce no output');
}

function testPreEditWriteBlock() {
  // protected-paths 应拦截 node_modules 下的文件
  const result = runDispatch('pre-tool-use/edit-write', {
    tool_input: { file_path: '/project/node_modules/foo/index.js' },
  });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout.trim());
  assert.equal(output.decision, 'block');
  assert.match(output.reason, /Protected Path/);
}

function testPreEditWritePass() {
  // 普通文件路径不应被拦截
  const result = runDispatch('pre-tool-use/edit-write', {
    tool_input: { file_path: '/project/src/app.js' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '', 'normal path should produce no output');
}

function testGitAddGuardBlock() {
  // git-add-guard 应拦截 git add .
  const result = runDispatch('pre-tool-use/bash', {
    tool_input: { command: 'git add .' },
  });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout.trim());
  assert.equal(output.decision, 'block');
  assert.match(output.reason, /Git Add Guard/);
}

function main() {
  try {
    testPreBashBlock();
    testPreBashPass();
    testPreEditWriteBlock();
    testPreEditWritePass();
    testGitAddGuardBlock();
    console.log(`${Colors.OKGREEN}claude hook smoke test passed${Colors.ENDC}`);
    return 0;
  } catch (error) {
    console.error(`${Colors.FAIL}Test failed:${Colors.ENDC} ${error.message}`);
    return 1;
  }
}

process.exit(main());
