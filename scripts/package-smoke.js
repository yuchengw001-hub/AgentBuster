// Developer release check: exercise the installed CLI from an unrelated cwd.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { once } from 'node:events';
const entry = path.resolve(process.argv[2] || 'reports/consumer-install/node_modules/agentbuster/bin/agentbuster.js');
const cwd = path.resolve(process.argv[3] || 'reports/consumer-project');
await mkdir(cwd, { recursive: true });
const reserve = createServer(); reserve.listen(0, '127.0.0.1'); await once(reserve, 'listening');
const port = reserve.address().port; await new Promise(resolve => reserve.close(resolve));
const worker = spawn(process.execPath, [entry, 'ui', '--port', String(port)], { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
const closed = once(worker, 'close'); let diagnostics = '';
worker.stderr.setEncoding('utf8'); worker.stderr.on('data', chunk => { diagnostics += chunk; });
const origin = `http://127.0.0.1:${port}`;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Installed console did not start')), 5000);
    worker.on('error', reject);
    worker.once('close', () => { clearTimeout(timer); reject(new Error(`Installed console closed: ${diagnostics}`)); });
    worker.stdout.setEncoding('utf8'); worker.stdout.on('data', chunk => { if (chunk.includes('AgentBuster console:')) { clearTimeout(timer); resolve(); } });
  });
  const response = await fetch(origin); const html = await response.text();
  if (!html.includes('Start test')) throw new Error('Installed UI entrypoint is missing');
  const token = html.match(/name="agentbuster-token" content="([a-f0-9]+)"/)[1];
  const started = await fetch(origin + '/api/jobs', { method: 'POST', headers: { origin, 'content-type': 'application/json', 'x-agentbuster-token': token }, body: JSON.stringify({ agent: 'showcase', suite: 'all', limit: 5, repeat: 1, timeoutMs: 15000, model: '' }) });
  if (started.status !== 202) throw new Error('Installed run endpoint rejected the case study');
  const { id } = await started.json(); let job;
  for (let i = 0; i < 100; i++) {
    const state = await (await fetch(origin + '/api/state')).json(); job = state.jobs.find(item => item.id === id);
    if (job?.status === 'completed') break;
    if (job?.status === 'error') throw new Error(job.error);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (job?.improvements !== 2) throw new Error('Installed case study did not verify both fixes');
  const report = await fetch(`${origin}/runs/${id}/fixed/report.json`);
  if ((await report.json()).passed !== 2) throw new Error('Installed report download is incorrect');
  console.log('PASS: installed CLI starts its console from a separate working directory, runs MCP cases, and serves the correct report.');
} finally { worker.kill(); await closed; }
