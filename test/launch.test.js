import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script, createContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
import { connectStdio } from '../src/mcp-client.js';
import { validateProxyConfig, readMessages } from '../src/mcp.js';
import { runShowcase } from '../src/showcase.js';
import { compareReports, replayText } from '../src/history.js';
import { locales, languageScript } from '../src/locales.js';
import { htmlReport } from '../src/reporters.js';
import { createSetup } from '../src/setup.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = (...args) => spawnSync(process.execPath, [path.join(root, 'bin/agentbuster.js'), ...args], { encoding: 'utf8', timeout: 15000 });
const temporary = async fn => {
  const dir = await mkdtemp(path.join(tmpdir(), 'agentbuster-launch-'));
  try { return await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
};
const config = faults => ({ server: { command: process.execPath, args: [path.join(root, 'examples/mcp-server.js')] }, timeoutMs: 1000, faults });
async function proxyClient(dir, settings) {
  const file = path.join(dir, 'proxy.json'), trace = path.join(dir, 'trace.jsonl');
  await writeFile(file, JSON.stringify(settings));
  const client = await connectStdio(process.execPath, [path.join(root, 'bin/agentbuster.js'), 'mcp', '--config', file, '--trace', trace]);
  await client.request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  client.notify('notifications/initialized');
  return { client, trace };
}

test('real MCP proxy preserves handshake, tools discovery, errors and concurrent calls', () => temporary(async dir => {
  const { client, trace } = await proxyClient(dir, config([]));
  try {
    assert.equal((await client.request('tools/list')).tools.length, 3);
    const answers = await Promise.all([client.request('tools/call', { name: 'get_status' }), client.request('tools/call', { name: 'lookup' })]);
    assert.equal(answers[0].content[0].text, 'healthy');
    assert.equal(answers[1].content[0].text, '2.4.1');
    assert.equal((await client.request('tools/call', { name: 'missing' })).isError, true);
    await assert.rejects(client.request('missing-method'), /Method not found/);
  } finally { assert.equal(await client.close(), 0); }
  const events = (await readFile(trace, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(events[0].transport, 'stdio');
  assert.equal(events.at(-1).type, 'session-end');
  assert(!JSON.stringify(events).includes('healthy')); // Default metadata-only privacy.
}));

test('MCP faults are deterministic per tool call and retain subsequent healthy result', () => temporary(async dir => {
  const { client } = await proxyClient(dir, config([{ tool: 'get_status', onCalls: [1], action: 'error', message: 'HTTP_429' }, { tool: 'lookup', onCalls: [1], action: 'inject', text: 'FAKE_ATTACK' }]));
  try {
    assert.equal((await client.request('tools/call', { name: 'get_status' })).isError, true);
    assert.equal((await client.request('tools/call', { name: 'get_status' })).content[0].text, 'healthy');
    assert.deepEqual((await client.request('tools/call', { name: 'lookup' })).content.map(c => c.text), ['2.4.1', 'FAKE_ATTACK']);
    assert.equal((await client.request('tools/call', { name: 'lookup' })).content.length, 1);
  } finally { await client.close(); }
}));

test('MCP delayed calls respect deadlines without executing a late delayed request', () => temporary(async dir => {
  const settings = config([{ tool: 'get_status', onCalls: [1], action: 'delay', delayMs: 300 }]); settings.timeoutMs = 100;
  const { client, trace } = await proxyClient(dir, settings);
  try {
    await assert.rejects(client.request('tools/call', { name: 'get_status' }), /deadline/);
    assert.equal((await client.request('tools/call', { name: 'get_status' })).content[0].text, 'healthy');
  } finally { await client.close(); }
  assert((await readFile(trace, 'utf8')).includes('"status":"timeout"'));
}));

test('captureContent requires opt-in and redacts explicit fake canaries', () => temporary(async dir => {
  const secret = 'BUSTER_TEST_PRIVATE_CANARY';
  const settings = { ...config([{ tool: 'lookup', action: 'inject', text: secret }]), captureContent: true, canaries: [secret] };
  const { client, trace } = await proxyClient(dir, settings);
  try { assert.equal((await client.request('tools/call', { name: 'lookup' })).content[1].text, secret); }
  finally { await client.close(); }
  const text = await readFile(trace, 'utf8');
  assert(!text.includes(secret)); assert(text.includes('[REDACTED_CANARY]'));
}));

test('MCP malformed upstream is bounded and exits as error', () => temporary(async dir => {
  const file = path.join(dir, 'config.json');
  await writeFile(file, JSON.stringify({ server: { command: process.execPath, args: ['-e', 'console.log("not-json")'] }, faults: [] }));
  const result = cli('mcp', '--config', file, '--trace', path.join(dir, 'trace.jsonl'));
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
}));

test('MCP config rejects invalid fault definitions before spawning', () => {
  assert.throws(() => validateProxyConfig(config([{ tool: 'x', action: 'execute-shell' }])));
  assert.throws(() => validateProxyConfig(config([{ tool: 'x', action: 'delay', delayMs: -1 }])));
  assert.throws(() => validateProxyConfig(config([{ tool: 'x', action: 'error', onCalls: [0] }])));
});

test('late upstream response cannot satisfy a reused client request ID', () => temporary(async dir => {
  const server = path.join(dir, 'slow-server.cjs');
  await writeFile(server, `const rl=require('node:readline').createInterface({input:process.stdin});let calls=0;rl.on('line',line=>{const m=JSON.parse(line);if(m.method==='initialize'){console.log(JSON.stringify({jsonrpc:'2.0',id:m.id,result:{}}));return}const n=++calls;setTimeout(()=>console.log(JSON.stringify({jsonrpc:'2.0',id:m.id,result:{content:[{type:'text',text:n===1?'first':'second'}]}})),n===1?300:150)});`);
  const file = path.join(dir, 'config.json');
  await writeFile(file, JSON.stringify({ server: { command: process.execPath, args: [server] }, faults: [], timeoutMs: 200 }));
  const child = spawn(process.execPath, [path.join(root, 'bin/agentbuster.js'), 'mcp', '--config', file, '--trace', path.join(dir, 'trace.jsonl')], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.resume();
  const queue = [];
  const next = () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(new Error('Test RPC deadline')); }, 4000);
    queue.push(message => { clearTimeout(timer); resolve(message); });
  });
  readMessages(child.stdout, message => queue.shift()?.(message), () => child.kill());
  const send = (id, method) => { const result = next(); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: { name: 'slow' } }) + '\n'); return result; };
  const closed = new Promise(resolve => child.on('close', resolve));
  try {
    await send(0, 'initialize');
    assert.match((await send(1, 'tools/call')).error.message, /deadline/);
    const reply = await send(1, 'tools/call');
    assert.equal(reply.id, 1);
    assert.equal(reply.result.content[0].text, 'second');
  } finally { child.stdin.end(); await closed; }
}));

test('showcase proves real fault/fix behavior, comparison, replay and regression CI gate', () => temporary(async dir => {
  const { broken, fixed, comparison } = await runShowcase(dir);
  assert.equal(broken.failed, 2); assert.equal(fixed.passed, 2);
  assert.equal(broken.demoKind, 'scripted-mcp');
  assert.equal(broken.results[0].trace[0].observation.isError, true);
  assert.equal(comparison.improvements.length, 2);
  assert.equal(compareReports(fixed, broken).regressions.length, 2);
  const replay = replayText(broken, 'mcp-injection');
  assert(replay.includes('send_network')); assert(replay.includes('FAILED ASSERTION'));
  assert.equal(cli('compare', '--baseline', path.join(dir, 'fixed/report.json'), '--input', path.join(dir, 'broken/report.json'), '--output', path.join(dir, 'regression')).status, 1);
  assert.equal(cli('replay', '--input', path.join(dir, 'broken/report.json'), '--id', 'mcp-injection').status, 0);
  const html = htmlReport(broken);
  assert(html.includes('Deterministic example clients exchange real MCP messages'));
  for (const change of [r => r.model = 'different', r => r.demo = false, r => r.suite.fingerprint = 'different', r => r.repeats = 2, r => r.limits.maxSteps = 99]) {
    const candidate = structuredClone(fixed); change(candidate);
    assert.throws(() => compareReports(broken, candidate), /not comparable/);
  }
}));

test('repeat metadata and counts are preserved and comparable', () => temporary(async dir => {
  const result = cli('test', '--id', 'recovery-01', '--repeat', '3', '--output', dir);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(await readFile(path.join(dir, 'report.json'), 'utf8'));
  assert.equal(report.results.length, 3); assert.equal(report.repeats, 3); assert.equal(report.passed, 3);
  assert.deepEqual(report.results.map(r => r.trial), [1, 2, 3]);
  assert.equal(compareReports(report, report).regressions.length, 0);
  const incomplete = structuredClone(report); incomplete.results.pop();
  assert.throws(() => compareReports(report, incomplete), /Incomplete/);
  assert.equal(cli('test', '--repeat', '0').status, 2);
}));

test('four-language UI defaults to English, persists selection and tolerates blocked storage', () => {
  const expectedKeys = Object.keys(locales.en).sort();
  for (const value of Object.values(locales)) assert.deepEqual(Object.keys(value).sort(), expectedKeys);
  const script = languageScript(); new Script(script);
  const labels = Object.keys(locales.en).map(key => ({ key, textContent: '', getAttribute() { return this.key; } }));
  labels.push({ key: 'case:recovery-01', textContent: 'Rate limit', getAttribute() { return this.key; } });
  const selector = { value: '', addEventListener(_event, callback) { this.change = callback; } };
  const saved = new Map();
  const context = createContext({ document: { documentElement: {}, title: '', getElementById: () => selector, querySelectorAll: query => query === '[data-i18n]' ? labels : [] }, localStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) } });
  new Script(script).runInContext(context);
  assert.equal(selector.value, 'en');
  for (const lang of ['zh-CN', 'ja', 'es', 'en']) {
    selector.value = lang; selector.change();
    assert.equal(context.document.documentElement.lang, lang);
    assert.equal(labels.find(x => x.key === 'agentScore').textContent, locales[lang].agentScore);
    assert.equal(saved.get('agentbuster-language'), lang);
    assert.equal(labels.at(-1).textContent === 'Rate limit', lang === 'en');
  }
  context.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  new Script(script).runInContext(context); assert.equal(selector.value, 'en');
  const html = htmlReport({ demo: true, score: 0, adapter: 'demo', model: 'demo', passed: 0, failed: 0, errors: 0, criticalFailures: [], suite: { selected: 0, available: 0 }, dimensions: {}, results: [], limits: {} });
  assert(html.includes(`script-src 'sha256-${createHash('sha256').update(script).digest('base64')}'`));
  assert(!html.includes("script-src 'unsafe-inline'"));
});

test('setup generates portable snippets for all four CLIs without overwriting user files', () => temporary(async dir => {
  const files = await createSetup(dir);
  assert.equal(files.length, 6);
  const claude = JSON.parse(await readFile(path.join(dir, 'claude.mcp.json'), 'utf8'));
  assert.equal(claude.mcpServers.agentbuster.command, process.execPath);
  assert(claude.mcpServers.agentbuster.args.includes(path.join(dir, 'faults.json')));
  const opencode = JSON.parse(await readFile(path.join(dir, 'opencode.json'), 'utf8'));
  assert.equal(opencode.mcp.agentbuster.type, 'local');
  assert((await readFile(path.join(dir, 'codex.mcp.toml'), 'utf8')).includes('[mcp_servers.agentbuster]'));
  await assert.rejects(createSetup(dir), /already exists/);
  assert.equal(JSON.parse(await readFile(path.join(dir, 'faults.json'), 'utf8')).captureContent, false);
}));

test('Action driver runs offline checks and writes a job summary', () => temporary(async dir => {
  const summary = path.join(dir, 'summary.md');
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/ci-check.js')], { encoding: 'utf8', timeout: 15000,
    env: { ...process.env, AB_ADAPTER: 'demo', AB_SUITE: 'recovery', AB_REPEAT: '1', AB_OUTPUT: path.join(dir, 'reports'), AB_BASELINE: '', AB_CONFIG: '', AB_MODEL: '', GITHUB_STEP_SUMMARY: summary } });
  assert.equal(result.status, 0, result.stderr);
  assert((await readFile(summary, 'utf8')).includes('Agent Score: 100/100'));
}));
