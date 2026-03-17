#!/usr/bin/env node
/**
 * Smoke test npm entrypoints without relying on a Python interpreter.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { filesMatch, isLinkOrJunction, sameFileReference } = require('./utils');

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function repoRoot() {
  return path.join(__dirname, '..');
}

function buildTempEnv(tempHome) {
  return {
    ...process.env,
    HOME: tempHome,
    USERPROFILE: tempHome,
  };
}

function runNpm(scriptName, env) {
  if (process.platform === 'win32') {
    return spawnSync('cmd.exe', ['/d', '/s', '/c', `npm run ${scriptName}`], {
      cwd: repoRoot(),
      env,
      encoding: 'utf8',
      timeout: 60000,
    });
  }

  return spawnSync(npmCommand(), ['run', scriptName], {
    cwd: repoRoot(),
    env,
    encoding: 'utf8',
    timeout: 60000,
  });
}

function assertLink(targetPath, expectedSource) {
  assert.equal(fs.existsSync(targetPath), true, `missing target: ${targetPath}`);
  assert.equal(isLinkOrJunction(targetPath), true, `not a link: ${targetPath}`);
  assert.equal(fs.realpathSync(targetPath), fs.realpathSync(expectedSource), `wrong target: ${targetPath}`);
}

function assertFile(targetPath, expectedSource) {
  assert.equal(fs.existsSync(targetPath), true, `missing file: ${targetPath}`);
  assert.equal(fs.statSync(targetPath).isFile(), true, `not a file: ${targetPath}`);
  assert.equal(filesMatch(targetPath, expectedSource), true, `wrong file content: ${targetPath}`);
  assert.equal(
    sameFileReference(targetPath, expectedSource),
    true,
    `target is not linked to source: ${targetPath}`,
  );
}

function assertBackupCreated(parentDir, prefix) {
  const entries = fs.readdirSync(parentDir).filter((name) => name.startsWith(`${prefix}.bak.`));
  assert.equal(entries.length > 0, true, `missing backup for ${prefix} in ${parentDir}`);
  return path.join(parentDir, entries[0]);
}

function testLinkSkills() {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-link-skills-'));
  try {
    const codexSkillsDir = path.join(tempHome, '.codex', 'skills');
    fs.mkdirSync(path.join(codexSkillsDir, '.system'), { recursive: true });
    fs.writeFileSync(path.join(codexSkillsDir, '.system', 'keep.txt'), 'keep');
    fs.mkdirSync(path.join(codexSkillsDir, 'pdf'), { recursive: true });
    fs.writeFileSync(path.join(codexSkillsDir, 'pdf', 'legacy.txt'), 'legacy');

    const result = runNpm('link:skills', buildTempEnv(tempHome));
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const sourceDir = path.join(repoRoot(), 'skills');
    assertLink(path.join(tempHome, '.claude', 'skills'), sourceDir);
    assertLink(path.join(tempHome, '.gemini', 'skills'), sourceDir);
    assert.equal(fs.existsSync(path.join(codexSkillsDir, '.system', 'keep.txt')), true);
    assertLink(path.join(codexSkillsDir, 'pdf'), path.join(sourceDir, 'pdf'));
    assertLink(path.join(codexSkillsDir, 'skill-creator'), path.join(sourceDir, 'skill-creator'));

    const backupDir = assertBackupCreated(codexSkillsDir, 'pdf');
    assert.equal(fs.existsSync(path.join(backupDir, 'legacy.txt')), true);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

function testLinkCodex() {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-link-codex-'));
  try {
    const result = runNpm('link:codex', buildTempEnv(tempHome));
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const sourceDir = path.join(repoRoot(), 'skills');
    assert.equal(fs.existsSync(path.join(tempHome, '.claude', 'skills')), false);
    assertLink(path.join(tempHome, '.codex', 'skills'), sourceDir);
    assert.equal(fs.existsSync(path.join(tempHome, '.gemini', 'skills')), false);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

function testSyncMemory() {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-sync-memory-'));
  try {
    const result = runNpm('sync:memory', buildTempEnv(tempHome));
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const sourceFile = path.join(repoRoot(), 'AGENTS.md');
    assertFile(path.join(tempHome, '.claude', 'CLAUDE.md'), sourceFile);
    assertFile(path.join(tempHome, '.codex', 'AGENTS.md'), sourceFile);
    assertFile(path.join(tempHome, '.gemini', 'GEMINI.md'), sourceFile);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

function main() {
  testLinkSkills();
  testLinkCodex();
  testSyncMemory();
  console.log('npm entrypoint smoke test passed');
}

main();
