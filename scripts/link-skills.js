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

function createLink(sourceDir, targetPath, label) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory does not exist: ${sourceDir}`);
  }

  ensureDir(path.dirname(targetPath));

  if (isLinkOrJunction(targetPath)) {
    removePath(targetPath);
    createDirectoryLink(sourceDir, targetPath);
    console.log(
      `${Colors.OKGREEN}Updated link [${label}]:${Colors.ENDC} ${targetPath} -> ${sourceDir}`,
    );
    return;
  }

  if (fs.existsSync(targetPath)) {
    backupExisting(targetPath);
  }

  createDirectoryLink(sourceDir, targetPath);
  console.log(
    `${Colors.OKGREEN}Created link [${label}]:${Colors.ENDC} ${targetPath} -> ${sourceDir}`,
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

    if (!fs.existsSync(sourceDir)) {
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
