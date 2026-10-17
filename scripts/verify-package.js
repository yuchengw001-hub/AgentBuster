import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check with npm run verify:package');
const metadata = JSON.parse(await readFile('package.json', 'utf8'));
const directory = path.resolve(`reports/release/v${metadata.version}`);
const prefix = path.resolve('.package-test', `${process.platform}-${process.version}`);
const records = [];
const run = (label, command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 60000, windowsHide: true, env: { ...process.env, npm_config_cache: path.resolve('reports/npm-cache') } });
  records.push({ label, status: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message });
  if (result.status !== 0) throw new Error(`${label} failed: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout.trim();
};
await mkdir(directory, { recursive: true });
await mkdir('reports/validation', { recursive: true });
let sha256, archive;
try {
  const packed = JSON.parse(run('pack', process.execPath, [npmCli, 'pack', '--json', '--pack-destination', directory]));
  archive = path.join(directory, packed[0].filename);
  sha256 = createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile(path.join(directory, 'SHA256SUMS.txt'), `${sha256}  ${packed[0].filename}\n`);
  run('install', process.execPath, [npmCli, 'install', '--global', '--prefix', prefix, archive, '--ignore-scripts', '--no-audit', '--no-fund']);
  const packageRoot = run('installed root', process.execPath, [npmCli, 'root', '--global', '--prefix', prefix]);
  const entry = path.join(packageRoot, 'agentbuster/bin/agentbuster.js');
  const version = run('installed version', process.execPath, [entry, '--version']);
  if (version !== metadata.version) throw new Error(`Installed version mismatch: ${version}`);
  run('installed console and MCP smoke', process.execPath, ['scripts/package-smoke.js', entry, path.join(prefix, 'consumer-workspace')]);
  console.log(`PASS: v${version} tarball packed, installed and tested; sha256=${sha256}`);
} finally {
  await writeFile(`reports/validation/package-${process.platform}-${process.version}.json`, JSON.stringify({ version: metadata.version, node: process.version, platform: process.platform, commit: process.env.GITHUB_SHA || null, run: process.env.GITHUB_RUN_ID || null, archive: archive && path.basename(archive), sha256, passed: records.length === 5 && records.every(r => r.status === 0), records }, null, 2));
}
