#!/usr/bin/env node
/**
 * Link AGENTS.md into local agent memory files across platforms.
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  Colors,
  backupExisting,
  createFileLink,
  ensureDir,
  getHomeDir,
  pathExists,
  sameFileReference,
} = require('./utils');

const AGENTS = ['claude', 'codex', 'gemini'];

function showHelp() {
  console.log(`
${Colors.HEADER}Usage:${Colors.ENDC}
  npm run sync:memory
  node ./scripts/sync-agent-memory.js [claude|codex|gemini|all] [--source <file>]

${Colors.HEADER}Behavior:${Colors.ENDC}
  Create direct file links to the source AGENTS.md instead of copying content.

${Colors.HEADER}Environment Variables:${Colors.ENDC}
  CLAUDE_MEMORY_TARGET=/path/to/CLAUDE.md
  CODEX_HOME=/path/to/codex-home
  CODEX_MEMORY_TARGET=/path/to/AGENTS.md
  GEMINI_MEMORY_TARGET=/path/to/GEMINI.md
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

function getDefaultTargets() {
  const home = getHomeDir();
  return {
    claude: path.join(home, '.claude', 'CLAUDE.md'),
    codex: path.join(home, '.codex', 'AGENTS.md'),
    gemini: path.join(home, '.gemini', 'GEMINI.md'),
  };
}

function getTargets() {
  const defaults = getDefaultTargets();
  return {
    claude: process.env.CLAUDE_MEMORY_TARGET
      ? path.resolve(process.env.CLAUDE_MEMORY_TARGET)
      : defaults.claude,
    codex: process.env.CODEX_MEMORY_TARGET
      ? path.resolve(process.env.CODEX_MEMORY_TARGET)
      : process.env.CODEX_HOME
        ? path.resolve(process.env.CODEX_HOME, 'AGENTS.md')
        : defaults.codex,
    gemini: process.env.GEMINI_MEMORY_TARGET
      ? path.resolve(process.env.GEMINI_MEMORY_TARGET)
      : defaults.gemini,
  };
}

function syncOne(label, sourceFile, targetFile) {
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file does not exist: ${sourceFile}`);
  }

  ensureDir(path.dirname(targetFile));

  if (sameFileReference(sourceFile, targetFile)) {
    console.log(`${Colors.OKCYAN}Already linked [${label}]:${Colors.ENDC} ${targetFile}`);
    return;
  }

  if (pathExists(targetFile)) {
    backupExisting(targetFile);
  }

  try {
    const linkType = createFileLink(sourceFile, targetFile);
    console.log(`${Colors.OKGREEN}Linked [${label}] (${linkType}):${Colors.ENDC} ${targetFile}`);
  } catch (error) {
    if (error.message.includes('cannot create file link')) {
      console.error(`${Colors.FAIL}错误:${Colors.ENDC} 此操作需要管理员权限`);
    }
    throw error;
  }
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      showHelp();
      return 0;
    }

    const sourceFile = path.resolve(
      args.source ?? path.join(__dirname, '..', 'AGENTS.md'),
    );

    if (!fs.existsSync(sourceFile)) {
      console.error(`${Colors.FAIL}Error:${Colors.ENDC} Source file does not exist: ${sourceFile}`);
      return 1;
    }

    const targets = getTargets();
    const selectedAgents = args.agent === 'all' ? AGENTS : [args.agent];

    for (const agent of selectedAgents) {
      syncOne(agent, sourceFile, targets[agent]);
    }

    return 0;
  } catch (error) {
    console.error(`${Colors.FAIL}Error:${Colors.ENDC} ${error.message}`);
    return 1;
  }
}

process.exit(main());
