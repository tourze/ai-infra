#!/usr/bin/env node
/**
 * Smoke test link-skills.js across supported agents.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { Colors, isLinkOrJunction, runCommand } = require('./utils');

function buildHomeEnv(tempHome) {
  return {
    ...process.env,
    HOME: tempHome,
    USERPROFILE: tempHome,
  };
}

function assertSymlinkTarget(targetPath, expectedSource) {
  if (!fs.existsSync(targetPath) && !isLinkOrJunction(targetPath)) {
    throw new Error(`Missing link: ${targetPath}`);
  }

  if (!isLinkOrJunction(targetPath)) {
    throw new Error(`Not a link or junction: ${targetPath}`);
  }

  const resolvedTarget = fs.realpathSync(targetPath);
  const resolvedSource = fs.realpathSync(expectedSource);
  assert.equal(resolvedTarget, resolvedSource);
}

function assertNotExists(targetPath) {
  if (fs.existsSync(targetPath) || isLinkOrJunction(targetPath)) {
    throw new Error(`Target should not exist: ${targetPath}`);
  }
}

function runScript(args, env) {
  return runCommand(process.execPath, [path.join(__dirname, 'link-skills.js'), ...args], {
    env,
    timeout: 30000,
  });
}

function testDefaultMode(sourceDir) {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'test-link-skills-'));
  try {
    const result = runScript([], buildHomeEnv(tempHome));
    assert.equal(result.status, 0, result.stderr || result.stdout);

    assertSymlinkTarget(path.join(tempHome, '.claude', 'skills'), sourceDir);
    assertSymlinkTarget(path.join(tempHome, '.codex', 'skills'), sourceDir);
    assertSymlinkTarget(path.join(tempHome, '.gemini', 'skills'), sourceDir);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

function testGeminiOnly(sourceDir) {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'test-link-gemini-'));
  try {
    const result = runScript(['gemini'], buildHomeEnv(tempHome));
    assert.equal(result.status, 0, result.stderr || result.stdout);

    assertNotExists(path.join(tempHome, '.claude', 'skills'));
    assertNotExists(path.join(tempHome, '.codex', 'skills'));
    assertSymlinkTarget(path.join(tempHome, '.gemini', 'skills'), sourceDir);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

function main() {
  const sourceDir = path.join(__dirname, '..', 'skills');
  if (!fs.existsSync(sourceDir)) {
    console.error(`${Colors.FAIL}Error:${Colors.ENDC} Source directory not found: ${sourceDir}`);
    return 1;
  }

  try {
    testDefaultMode(sourceDir);
    testGeminiOnly(sourceDir);
    console.log(`${Colors.OKGREEN}link:skills smoke test passed${Colors.ENDC}`);
    return 0;
  } catch (error) {
    console.error(`${Colors.FAIL}Test failed:${Colors.ENDC} ${error.message}`);
    return 1;
  }
}

process.exit(main());
