#!/usr/bin/env node
/**
 * Sync mapped GitHub directories into local skills folders.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runCommand } = require('./scripts/utils');

function showHelp() {
  console.log(`Usage:
  npm run sync:skills
  node ./sync-skills.js [--map <file>] [--dest <dir>] [--dry-run]
`);
}

function parseArgs(argv) {
  const options = {
    map: 'skills-map.txt',
    dest: 'skills',
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '-h' || token === '--help') {
      options.help = true;
      continue;
    }
    if (token === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (token === '--map') {
      options.map = argv[index + 1];
      index += 1;
      continue;
    }
    if (token.startsWith('--map=')) {
      options.map = token.slice('--map='.length);
      continue;
    }
    if (token === '--dest') {
      options.dest = argv[index + 1];
      index += 1;
      continue;
    }
    if (token.startsWith('--dest=')) {
      options.dest = token.slice('--dest='.length);
      continue;
    }
    throw new Error(`Unknown option: ${token}`);
  }

  return options;
}

function parseRemoteUrl(remoteUrl) {
  const parsed = new URL(remoteUrl);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.hostname !== 'github.com') {
    throw new Error('仅支持 https://github.com/.../tree/... 格式。');
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 5 || parts[2] !== 'tree') {
    throw new Error('URL 必须是 /<owner>/<repo>/tree/<ref>/<path> 结构。');
  }

  const remotePath = parts.slice(4).join('/').trim();
  if (!remotePath) {
    throw new Error('URL 中缺少远程目录路径。');
  }

  return {
    owner: parts[0],
    repo: parts[1],
    ref: parts[3],
    remotePath,
  };
}

function parseMappingLine(line, lineNumber) {
  if (!line.includes('=>')) {
    throw new Error(`skills-map.txt:${lineNumber}: 缺少 '=>' 分隔符。`);
  }

  const [remoteUrl, localDir] = line.split('=>').map((part) => part.trim());
  if (!remoteUrl || !localDir) {
    throw new Error(`skills-map.txt:${lineNumber}: 远程地址和本地目录都不能为空。`);
  }
  if (localDir === '.' || localDir === '/') {
    throw new Error(`skills-map.txt:${lineNumber}: 本地目录不能是 '.' 或 '/'。`);
  }

  return {
    remoteUrl,
    localDir,
    ...parseRemoteUrl(remoteUrl),
  };
}

function loadMappings(mappingFile) {
  if (!fs.existsSync(mappingFile)) {
    throw new Error(`映射文件不存在: ${mappingFile}`);
  }

  const lines = fs.readFileSync(mappingFile, 'utf8').split(/\r?\n/);
  const mappings = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      return;
    }
    mappings.push(parseMappingLine(line, index + 1));
  });

  if (mappings.length === 0) {
    throw new Error(`映射文件为空: ${mappingFile}`);
  }

  return mappings;
}

function safeDest(destRoot, localDir) {
  const root = path.resolve(destRoot);
  const destination = path.resolve(root, localDir);
  const relative = path.relative(root, destination);

  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`本地目录越界或指向根目录: ${localDir}`);
  }

  return destination;
}

function validateUniqueDestinations(destRoot, mappings) {
  const seen = new Map();
  for (const mapping of mappings) {
    const destination = safeDest(destRoot, mapping.localDir);
    const existing = seen.get(destination);
    if (existing && existing.remoteUrl !== mapping.remoteUrl) {
      throw new Error(
        `本地目录冲突: ${destination}\n  - ${existing.remoteUrl}\n  - ${mapping.remoteUrl}`,
      );
    }
    seen.set(destination, mapping);
  }
}

function ensureGit() {
  const result = runCommand('git', ['--version']);
  if (result.status !== 0) {
    throw new Error('未检测到可用的 git，请先安装并确保在 PATH 中。');
  }
}

function runGit(args) {
  const result = runCommand('git', args);
  if (result.status !== 0) {
    throw new Error(result.stdout?.trim() || result.stderr?.trim() || `命令失败: git ${args.join(' ')}`);
  }
  return result;
}

function cloneSparseGroup(owner, repo, ref, remotePaths, workdir) {
  const checkoutDir = path.join(workdir, `${owner}_${repo}_${ref}`.replaceAll('/', '_'));
  runGit([
    'clone',
    '--depth',
    '1',
    '--filter=blob:none',
    '--sparse',
    '--branch',
    ref,
    `https://github.com/${owner}/${repo}.git`,
    checkoutDir,
  ]);
  runGit([
    '-C',
    checkoutDir,
    'sparse-checkout',
    'set',
    '--no-cone',
    ...Array.from(new Set(remotePaths)).sort(),
  ]);
  return checkoutDir;
}

function syncOne(sourcePath, destinationPath, dryRun) {
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
    throw new Error(`远程目录不存在: ${sourcePath}`);
  }
  if (dryRun) {
    return;
  }

  if (fs.existsSync(destinationPath)) {
    if (!fs.statSync(destinationPath).isDirectory()) {
      throw new Error(`本地目标不是目录: ${destinationPath}`);
    }
    fs.rmSync(destinationPath, { recursive: true, force: true });
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      showHelp();
      return 0;
    }

    ensureGit();
    const mappingFile = path.resolve(args.map);
    const destRoot = path.resolve(args.dest);
    const mappings = loadMappings(mappingFile);
    validateUniqueDestinations(destRoot, mappings);

    const grouped = new Map();
    for (const mapping of mappings) {
      const key = `${mapping.owner}/${mapping.repo}@${mapping.ref}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(mapping);
    }

    const failures = [];
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-sync-'));

    try {
      for (const items of grouped.values()) {
        const [{ owner, repo, ref }] = items;
        console.log(`\n==> 拉取 ${owner}/${repo}@${ref}`);

        let checkoutDir;
        try {
          checkoutDir = cloneSparseGroup(
            owner,
            repo,
            ref,
            items.map((item) => item.remotePath),
            tempDir,
          );
        } catch (error) {
          const message = `${owner}/${repo}@${ref} 拉取失败: ${error.message}`;
          failures.push(message);
          console.error(`[失败] ${message}`);
          continue;
        }

        for (const item of items) {
          const destination = safeDest(destRoot, item.localDir);
          const sourcePath = path.join(checkoutDir, item.remotePath);
          console.log(`  - ${item.remoteUrl} => ${destination}`);
          try {
            syncOne(sourcePath, destination, args.dryRun);
          } catch (error) {
            const message = `${item.remoteUrl} 同步失败: ${error.message}`;
            failures.push(message);
            console.error(`[失败] ${message}`);
          }
        }
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    if (failures.length > 0) {
      console.error('\n同步完成（有失败项）:');
      failures.forEach((failure) => console.error(`  - ${failure}`));
      return 1;
    }

    console.log(args.dryRun ? '\nDry-run 完成，未写入任何文件。' : '\n全部同步完成。');
    return 0;
  } catch (error) {
    console.error(`初始化失败: ${error.message}`);
    return 1;
  }
}

process.exit(main());
