import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const rounds = Number(process.argv[2] || 20);
if (!Number.isInteger(rounds) || rounds < 1 || rounds > 100) throw new Error('Rounds must be 1..100');
const results = [];
try {
  for (let round = 1; round <= rounds; round++) {
    console.log(`MCP stability round ${round}/${rounds}`);
    const started = Date.now();
    const result = spawnSync(process.execPath, ['--test', '--test-timeout=30000', 'test/launch.test.js'], { stdio: 'inherit', timeout: 60000, windowsHide: true });
    results.push({ round, status: result.status, signal: result.signal, durationMs: Date.now() - started, error: result.error?.message });
    if (result.status !== 0) throw new Error(`Stability round ${round} failed`);
  }
} finally {
  const directory = path.resolve('reports/validation');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `stability-${process.platform}-${process.version}.json`), JSON.stringify({ node: process.version, platform: process.platform, commit: process.env.GITHUB_SHA || null, run: process.env.GITHUB_RUN_ID || null, requested: rounds, completed: results.length, passed: results.filter(r => r.status === 0).length, results }, null, 2));
}
