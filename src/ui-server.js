import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir, realpath } from 'node:fs/promises';
import { randomUUID, randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveExecutable, runProcess } from './process.js';
import { redact } from './reporters.js';
import { loadSuite } from './suite.js';
import { compareReports, comparisonMarkdown } from './history.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const suites = { all: null, security: ['prompt-injection', 'secrets', 'permissions'], recovery: ['recovery'], reliability: ['reliability', 'loops'], tools: ['tool-use'], context: ['context'], 'task-completion': ['reliability', 'tool-use', 'recovery'] };
const agents = ['showcase', 'demo', 'codex', 'claude', 'gemini', 'opencode'];
const staticFiles = { '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/app.css': ['app.css', 'text/css; charset=utf-8'] };
const reportFiles = { 'report.html': 'text/html; charset=utf-8', 'report.json': 'application/json', 'report.md': 'text/plain; charset=utf-8', 'badge.svg': 'image/svg+xml', 'comparison.json': 'application/json', 'comparison.md': 'text/plain; charset=utf-8' };

function validateRun(data) {
  if (!data || !agents.includes(data.agent) || !Object.hasOwn(suites, data.suite) || ![1, 5, 10, 50].includes(data.limit) || ![1, 3, 5].includes(data.repeat) || ![15000, 60000, 120000].includes(data.timeoutMs)) throw new Error('Invalid run configuration');
  if (typeof data.model !== 'string' || data.model.length > 120 || /[\x00-\x1f]/.test(data.model) || data.model.startsWith('--')) throw new Error('Invalid model name');
  if (!['showcase', 'demo'].includes(data.agent) && data.allowPaid !== true) throw new Error('Confirm provider usage before starting a real agent');
  if (data.baselineId && (typeof data.baselineId !== 'string' || !uuid.test(data.baselineId))) throw new Error('Invalid baseline ID');
  return data;
}

export async function createUiServer({ outputDir = path.resolve('reports/ui') } = {}) {
  outputDir = path.resolve(outputDir);
  await mkdir(outputDir, { recursive: true });
  const storageRoot = await realpath(outputDir);
  const suite = await loadSuite(path.join(root, 'scenarios/default.json'));
  const canaries = suite.scenarios.flatMap(s => s.canaries || []);
  const token = randomBytes(32).toString('hex');
  const jobs = new Map(); let active, controller, starting = false, environment = [];
  const safe = value => redact(value, canaries);
  const persist = job => writeFile(path.join(outputDir, job.id, 'job.json'), JSON.stringify(safe(job), null, 2));
  for (const entry of (await readdir(outputDir, { withFileTypes: true })).filter(e => e.isDirectory() && uuid.test(e.name)).slice(-100)) {
    try {
      const job = JSON.parse(await readFile(path.join(outputDir, entry.name, 'job.json'), 'utf8'));
      if (job.id !== entry.name || !agents.includes(job.agent) || typeof job.startedAt !== 'string') continue;
      if (['running', 'cancelling'].includes(job.status)) { job.status = 'interrupted'; job.error = 'Server stopped before this run completed'; }
      jobs.set(job.id, job);
    } catch { /* Ignore incomplete local history entries. */ }
  }
  async function doctor() {
    environment = await Promise.all(['codex', 'claude', 'gemini', 'opencode'].map(async name => {
      try { await resolveExecutable(name); return { name, installed: true }; }
      catch { return { name, installed: false }; }
    }));
    return environment;
  }
  await doctor();
  const jobDir = id => path.join(outputDir, id);
  async function withinStorage(file) {
    const resolved = await realpath(file);
    const relative = path.relative(storageRoot, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Artifact is outside report storage');
    return resolved;
  }
  async function loadJobReport(job) {
    return JSON.parse(await readFile(await withinStorage(path.join(jobDir(job.id), job.agent === 'showcase' ? 'fixed/report.json' : 'report.json')), 'utf8'));
  }
  async function execute(job, abort) {
    let progressRemainder = '';
    let finalStatus = 'error';
    const args = [path.join(root, 'bin/agentbuster.js')];
    if (job.agent === 'showcase') args.push('showcase', '--output', jobDir(job.id));
    else {
      args.push('test', '--agent', job.agent, '--suite', job.suite, '--limit', String(job.limit), '--repeat', String(job.repeat), '--timeout', String(job.timeoutMs), '--output', jobDir(job.id));
      if (job.model) args.push('--model', job.model);
    }
    try {
      await runProcess(process.execPath, args, {
        cwd: root, signal: abort.signal, cooperativeCancel: true, timeoutMs: Math.min(1800000, job.timeoutMs * job.total + 15000),
        onStdout(chunk) {
          job.log = (job.log + chunk).slice(-24000);
          if (job.agent !== 'showcase') {
            const lines = (progressRemainder + chunk).split(/\r?\n/); progressRemainder = lines.pop();
            job.done = Math.min(job.total, job.done + lines.filter(line => /^(?:PASS|FAIL|ERROR)\s/.test(line)).length);
          }
        }
      });
    } catch (e) { job.error = e.message; }
    try {
      if (abort.signal.aborted) { finalStatus = 'cancelled'; job.error = undefined; }
      else {
        try {
          const report = await loadJobReport(job);
          job.summary = { score: report.score, passed: report.passed, failed: report.failed, errors: report.errors, demo: report.demo, scope: report.scope };
          finalStatus = report.errors ? 'error' : report.failed ? 'findings' : 'completed';
          job.done = job.total;
          // Graded failures exit nonzero too; the report contains the useful explanation.
          job.error = report.errors ? report.results.find(r => r.status === 'error')?.error : undefined;
          if (job.agent === 'showcase') {
            const comparison = JSON.parse(await readFile(await withinStorage(path.join(jobDir(job.id), 'comparison.json')), 'utf8'));
            job.improvements = comparison.improvements.length;
          }
          if (job.baselineId) {
            try {
              const baseline = jobs.get(job.baselineId);
              if (!baseline?.summary) throw new Error('Baseline report is unavailable');
              const comparison = compareReports(await loadJobReport(baseline), report);
              await writeFile(path.join(jobDir(job.id), 'comparison.json'), JSON.stringify(comparison, null, 2));
              await writeFile(path.join(jobDir(job.id), 'comparison.md'), comparisonMarkdown(comparison));
              job.comparison = { regressions: comparison.regressions.length, improvements: comparison.improvements.length, delta: comparison.delta };
            } catch (e) { job.comparisonError = e.message; }
          }
        } catch (e) {
          finalStatus = 'error';
          if (!job.error) job.error = e.message;
        }
      }
      if (abort.signal.aborted) { finalStatus = 'cancelled'; job.error = undefined; job.summary = undefined; }
      job.finishedAt = new Date().toISOString();
      await persist({ ...job, status: finalStatus });
      job.status = finalStatus;
    } catch (e) { job.status = 'error'; job.error = e.message; }
    finally { if (active === job.id) { active = undefined; controller = undefined; } }
  }
  function json(res, code, value) {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    res.end(JSON.stringify(safe(value)));
  }
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('Expected application/json');
    let content = '';
    for await (const chunk of req) { content += chunk; if (Buffer.byteLength(content) > 8192) throw new Error('Request body too large'); }
    return JSON.parse(content);
  }
  const server = createServer(async (req, res) => {
    const address = server.address();
    const allowedHosts = [`127.0.0.1:${address.port}`, `localhost:${address.port}`];
    if (!allowedHosts.includes(req.headers.host)) { json(res, 403, { error: 'Invalid host' }); return; }
    const origin = `http://${req.headers.host}`;
    if (req.headers.origin && req.headers.origin !== origin) { json(res, 403, { error: 'Cross-origin requests are blocked' }); return; }
    const url = new URL(req.url, origin);
    if (req.method === 'POST' && (req.headers.origin !== origin || req.headers['x-agentbuster-token'] !== token)) { json(res, 403, { error: 'Invalid local session token or origin; reload this page' }); return; }
    try {
      if (req.method === 'GET' && url.pathname === '/') {
        const html = (await readFile(path.join(root, 'ui/index.html'), 'utf8')).replace('__SESSION_TOKEN__', token);
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'", 'x-content-type-options': 'nosniff' }); res.end(html); return;
      }
      if (req.method === 'GET' && Object.hasOwn(staticFiles, url.pathname)) {
        const [file, type] = staticFiles[url.pathname];
        const content = await readFile(path.join(root, 'ui', file));
        res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(content); return;
      }
      if (req.method === 'GET' && url.pathname === '/api/state') {
        json(res, 200, { environment, active: active || null, jobs: [...jobs.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 50) }); return;
      }
      if (req.method === 'POST' && url.pathname === '/api/doctor') { json(res, 200, { environment: await doctor() }); return; }
      if (req.method === 'POST' && url.pathname === '/api/jobs') {
        if (active || starting) { json(res, 409, { error: 'A test is already running. Stop it or wait for completion.' }); return; }
        starting = true;
        try {
        const data = validateRun(await body(req));
        if (!['demo', 'showcase'].includes(data.agent)) {
          await doctor();
          if (!environment.find(e => e.name === data.agent)?.installed) { json(res, 400, { error: `${data.agent} is not installed. Install and authenticate the CLI in your terminal, then check again.` }); return; }
        }
        if (data.baselineId && !jobs.get(data.baselineId)?.summary) throw new Error('Select an existing completed baseline');
        const count = suite.scenarios.filter(s => !suites[data.suite] || suites[data.suite].includes(s.category)).length;
        const job = { id: randomUUID(), agent: data.agent, suite: data.suite, limit: data.limit, repeat: data.repeat, timeoutMs: data.timeoutMs, model: data.model, baselineId: data.baselineId || undefined, status: 'running', startedAt: new Date().toISOString(), total: data.agent === 'showcase' ? 1 : Math.min(data.limit, count) * data.repeat, done: 0, log: '' };
        await mkdir(jobDir(job.id)); await persist(job);
        jobs.set(job.id, job); active = job.id; controller = new AbortController();
        void execute(job, controller);
        json(res, 202, { id: job.id }); return;
        } finally { starting = false; }
      }
      const cancel = url.pathname.match(/^\/api\/jobs\/([0-9a-f-]+)\/cancel$/);
      if (req.method === 'POST' && cancel) {
        if (active !== cancel[1] || !controller) { json(res, 409, { error: 'This run is no longer active' }); return; }
        jobs.get(active).status = 'cancelling'; controller.abort(); json(res, 202, { cancelled: true }); return;
      }
      const artifact = url.pathname.match(/^\/runs\/([0-9a-f-]+)\/(?:(broken|fixed)\/)?(report\.html|report\.json|report\.md|badge\.svg|comparison\.json|comparison\.md)$/);
      if (req.method === 'GET' && artifact && uuid.test(artifact[1]) && jobs.get(artifact[1])?.summary) {
        const file = path.join(jobDir(artifact[1]), artifact[2] || '', artifact[3]);
        const checked = await withinStorage(file);
        const content = await readFile(checked);
        res.writeHead(200, { 'content-type': reportFiles[artifact[3]], 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }); res.end(content); return;
      }
      json(res, 404, { error: 'Not found' });
    } catch (e) { json(res, e.code === 'ENOENT' ? 404 : 400, { error: e.message }); }
  });
  return { server, async stop() { controller?.abort(); await new Promise(resolve => server.close(resolve)); }, doctor };
}

export async function serveUi({ port = 4317, outputDir } = {}) {
  const app = await createUiServer({ outputDir });
  await new Promise((resolve, reject) => { app.server.once('error', reject); app.server.listen(port, '127.0.0.1', resolve); });
  console.log(`AgentBuster console: http://127.0.0.1:${app.server.address().port}\nSelect a target and click Start test. Ctrl+C stops the local console.`);
  return app;
}
