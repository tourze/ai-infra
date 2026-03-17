#!/usr/bin/env node
/**
 * Link repository skills into local agent directories across platforms.
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  Colors,
  backupExisting,
  createDirectoryLink,
  ensureDir,
  getHomeDir,
  isLinkOrJunction,
  pathExists,
  removePath,
} = require('./utils');

const AGENTS = ['cc', 'codex', 'gemini'];

function showHelp() {
  console.log(`
${Colors.HEADER}Usage:${Colors.ENDC}
  npm run link:skills
  npm run link:cc
  npm run link:gemini
  node ./scripts/link-skills.js [cc|codex|gemini|all] [--source <dir>]

${Colors.HEADER}Environment Variables:${Colors.ENDC}
  CC_TARGET=/path/to/cc/skills
  CODEX_TARGET=/path/to/codex/skills
  GEMINI_TARGET=/path/to/gemini/skills
`);
}

function parseArgs(argv) {
  let agent = 'all';
  let source;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '-h' || token === '--help') {
      return { help: true };
    }
    if (token === '--source') {
      source = argv[index + 1];
      index += 1;
      continue;
    }
    if (token.startsWith('--source=')) {
      source = token.slice('--source='.length);
      continue;
    }
    if (token.startsWith('-')) {
      throw new Error(`Unknown option: ${token}`);
    }
    agent = token;
  }

  if (!['all', ...AGENTS].includes(agent)) {
    throw new Error(`Unsupported agent: ${agent}`);
  }

  return { help: false, agent, source };
}

function getDefaultPaths() {
  const home = getHomeDir();
  return {
    cc: path.join(home, '.claude', 'skills'),
    codex: path.join(home, '.codex', 'skills'),
    gemini: path.join(home, '.gemini', 'skills'),
  };
}

function getTargetPaths() {
  const defaults = getDefaultPaths();
  return {
    cc: process.env.CC_TARGET ? path.resolve(process.env.CC_TARGET) : defaults.cc,
    codex: process.env.CODEX_TARGET ? path.resolve(process.env.CODEX_TARGET) : defaults.codex,
    gemini: process.env.GEMINI_TARGET
      ? path.resolve(process.env.GEMINI_TARGET)
      : defaults.gemini,
  };
}

function sameResolvedPath(firstPath, secondPath) {
  try {
    return fs.realpathSync(firstPath) === fs.realpathSync(secondPath);
  } catch {
    return false;
  }
}

function replaceWithDirectoryLink(sourcePath, targetPath, label) {
  if (isLinkOrJunction(targetPath)) {
    if (sameResolvedPath(targetPath, sourcePath)) {
      console.log(
        `${Colors.OKCYAN}Link already current [${label}]:${Colors.ENDC} ${targetPath} -> ${sourcePath}`,
      );
      return;
    }

    removePath(targetPath);
    createDirectoryLink(sourcePath, targetPath);
    console.log(
      `${Colors.OKGREEN}Updated link [${label}]:${Colors.ENDC} ${targetPath} -> ${sourcePath}`,
    );
    return;
  }

  if (pathExists(targetPath)) {
    backupExisting(targetPath);
  }

  createDirectoryLink(sourcePath, targetPath);
  console.log(
    `${Colors.OKGREEN}Created link [${label}]:${Colors.ENDC} ${targetPath} -> ${sourcePath}`,
  );
}

function linkSkillEntries(sourceDir, targetPath, label) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const sourceEntry = path.join(sourceDir, entry.name);
    const targetEntry = path.join(targetPath, entry.name);
    replaceWithDirectoryLink(sourceEntry, targetEntry, `${label}/${entry.name}`);
  }
}

function createLink(sourceDir, targetPath, label) {
  if (!pathExists(sourceDir)) {
    throw new Error(`Source directory does not exist: ${sourceDir}`);
  }

  ensureDir(path.dirname(targetPath));

  if (!pathExists(targetPath) || isLinkOrJunction(targetPath)) {
    replaceWithDirectoryLink(sourceDir, targetPath, label);
    return;
  }

  if (!fs.lstatSync(targetPath).isDirectory()) {
    replaceWithDirectoryLink(sourceDir, targetPath, label);
    return;
  }

  linkSkillEntries(sourceDir, targetPath, label);
  console.log(
    `${Colors.OKGREEN}Updated directory [${label}]:${Colors.ENDC} ${targetPath}`,
  );
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      showHelp();
      return 0;
    }

    const sourceDir = path.resolve(
      args.source ?? path.join(__dirname, '..', 'skills'),
    );

    if (!pathExists(sourceDir)) {
      console.error(`${Colors.FAIL}Error:${Colors.ENDC} Source directory does not exist: ${sourceDir}`);
      return 1;
    }

    const targets = getTargetPaths();
    const selectedAgents = args.agent === 'all' ? AGENTS : [args.agent];

    for (const agent of selectedAgents) {
      createLink(sourceDir, targets[agent], agent);
    }

    return 0;
  } catch (error) {
    console.error(`${Colors.FAIL}Error:${Colors.ENDC} ${error.message}`);
    return 1;
  }
}

process.exit(main());
