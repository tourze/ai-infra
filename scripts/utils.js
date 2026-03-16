/**
 * Shared utilities for repository Node.js scripts.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const IS_WINDOWS = process.platform === 'win32';
const supportsColor = process.stdout.isTTY;

const Colors = supportsColor
  ? {
      HEADER: '\u001b[95m',
      OKBLUE: '\u001b[94m',
      OKCYAN: '\u001b[96m',
      OKGREEN: '\u001b[92m',
      WARNING: '\u001b[93m',
      FAIL: '\u001b[91m',
      ENDC: '\u001b[0m',
      BOLD: '\u001b[1m',
      UNDERLINE: '\u001b[4m',
    }
  : {
      HEADER: '',
      OKBLUE: '',
      OKCYAN: '',
      OKGREEN: '',
      WARNING: '',
      FAIL: '',
      ENDC: '',
      BOLD: '',
      UNDERLINE: '',
    };

function getHomeDir() {
  return os.homedir();
}

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function backupExisting(targetPath) {
  if (!pathExists(targetPath)) {
    return null;
  }

  const backupPath = `${targetPath}.bak.${formatTimestamp()}`;
  fs.renameSync(targetPath, backupPath);
  console.log(
    `${Colors.OKGREEN}Backup created:${Colors.ENDC} ${targetPath} -> ${backupPath}`,
  );
  return backupPath;
}

function getFileHash(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}

function filesMatch(firstPath, secondPath) {
  if (!fs.existsSync(firstPath) || !fs.existsSync(secondPath)) {
    return false;
  }

  return getFileHash(firstPath) === getFileHash(secondPath);
}

function isLinkOrJunction(targetPath) {
  try {
    fs.readlinkSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function pathExists(targetPath) {
  try {
    fs.lstatSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removePath(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function createDirectoryLink(sourcePath, targetPath) {
  const linkSource = IS_WINDOWS ? path.resolve(sourcePath) : sourcePath;
  fs.symlinkSync(linkSource, targetPath, IS_WINDOWS ? 'junction' : 'dir');
}

function createFileLink(sourcePath, targetPath) {
  const resolvedSource = path.resolve(sourcePath);
  if (!IS_WINDOWS) {
    fs.symlinkSync(resolvedSource, targetPath, 'file');
    return 'symlink';
  }

  try {
    fs.linkSync(resolvedSource, targetPath);
    return 'hardlink';
  } catch (hardlinkError) {
    try {
      fs.symlinkSync(resolvedSource, targetPath, 'file');
      return 'symlink';
    } catch (symlinkError) {
      throw new Error(
        `cannot create file link; hardlink failed (${hardlinkError.code ?? hardlinkError.message}), `
          + `symlink failed (${symlinkError.code ?? symlinkError.message})`,
      );
    }
  }
}

function sameFileReference(firstPath, secondPath) {
  try {
    if (fs.realpathSync(firstPath) === fs.realpathSync(secondPath)) {
      return true;
    }
    const firstStat = fs.statSync(firstPath);
    const secondStat = fs.statSync(secondPath);
    return (
      firstStat.dev === secondStat.dev
      && firstStat.ino !== 0
      && secondStat.ino !== 0
      && firstStat.ino === secondStat.ino
    );
  } catch {
    return false;
  }
}

function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    input: options.input,
    stdio: options.stdio ?? 'pipe',
    encoding: 'utf8',
    timeout: options.timeout,
  });
}

module.exports = {
  Colors,
  IS_WINDOWS,
  backupExisting,
  createDirectoryLink,
  createFileLink,
  ensureDir,
  filesMatch,
  getHomeDir,
  isLinkOrJunction,
  pathExists,
  removePath,
  runCommand,
  sameFileReference,
};
