#!/usr/bin/env node
/**
 * Smoke test sync-agent-memory.js across supported agents.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { Colors, filesMatch, runCommand, sameFileReference } = require('./utils');

function buildHomeEnv(tempHome) {
  return {
    ...process.env,
    HOME: tempHome,
    USERPROFILE: tempHome,
  };
}

function assertSameFile(sourcePath, targetPath) {
  assert.equal(fs.existsSync(targetPath), true, `Missing file: ${targetPath}`);
  assert.equal(filesMatch(sourcePath, targetPath), true, `Content mismatch: ${targetPath}`);
  assert.equal(
    sameFileReference(sourcePath, targetPath),
    true,
    `Target is not linked to source: ${targetPath}`,
  );
}

function main() {
  const scriptPath = path.join(__dirname, 'sync-agent-memory.js');

  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'test-sync-memory-'));
  const tempSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-sync-source-'));
  const sourceFile = path.join(tempSourceDir, 'AGENTS.md');
  try {
    fs.writeFileSync(sourceFile, '# initial\n', 'utf8');
    const rerun = runCommand(
      process.execPath,
      [scriptPath, '--source', sourceFile],
      {
        env: buildHomeEnv(tempHome),
        timeout: 30000,
      },
    );
    assert.equal(rerun.status, 0, rerun.stderr || rerun.stdout);

    assertSameFile(sourceFile, path.join(tempHome, '.claude', 'CLAUDE.md'));
    assertSameFile(sourceFile, path.join(tempHome, '.codex', 'AGENTS.md'));
    assertSameFile(sourceFile, path.join(tempHome, '.gemini', 'GEMINI.md'));
    fs.writeFileSync(sourceFile, '# updated\n', 'utf8');
    assert.equal(
      fs.readFileSync(path.join(tempHome, '.claude', 'CLAUDE.md'), 'utf8'),
      '# updated\n',
      'Linked target did not reflect source update',
    );

    console.log(`${Colors.OKGREEN}sync:memory smoke test passed${Colors.ENDC}`);
    return 0;
  } catch (error) {
    console.error(`${Colors.FAIL}Test failed:${Colors.ENDC} ${error.message}`);
    return 1;
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
    fs.rmSync(tempSourceDir, { recursive: true, force: true });
  }
}

process.exit(main());
