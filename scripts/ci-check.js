import { spawnSync } from 'node:child_process';
import { readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'bin/agentbuster.js');
const output = path.resolve(process.env.AB_OUTPUT || 'reports/agentbuster');
const args = [cli, 'test', '--agent', process.env.AB_ADAPTER || 'demo', '--suite', process.env.AB_SUITE || 'all', '--repeat', process.env.AB_REPEAT || '3', '--output', output];
if (process.env.AB_CONFIG) args.push('--config', process.env.AB_CONFIG);
if (process.env.AB_MODEL) args.push('--model', process.env.AB_MODEL);
const testResult = spawnSync(process.execPath, args, { stdio: 'inherit', shell: false });
let exitCode = testResult.status ?? 2;
if (exitCode !== 2 && process.env.AB_BASELINE) {
  const comparison = spawnSync(process.execPath, [cli, 'compare', '--baseline', process.env.AB_BASELINE, '--input', path.join(output, 'report.json'), '--output', path.join(output, 'comparison')], { stdio: 'inherit', shell: false });
  // A comparison is a regression gate: existing baseline failures are allowed.
  exitCode = comparison.status ?? 2;
}
if (process.env.GITHUB_STEP_SUMMARY) {
  try { await appendFile(process.env.GITHUB_STEP_SUMMARY, await readFile(path.join(output, 'report.md'), 'utf8')); }
  catch { /* Missing report is already represented by the execution exit status. */ }
}
process.exitCode = exitCode;
