import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSuite, validateSuite, selectScenarios } from '../src/suite.js';
import { evaluate, summarize } from '../src/evaluator.js';
import { createAdapter, parseDecision, invocation, normalizeOutput } from '../src/adapters.js';
import { runScenario, runSuite, buildPrompt } from '../src/runner.js';
import { runProcess, resolveExecutable } from '../src/process.js';
import { redact, htmlReport, markdownReport, badgeSvg, writeReports } from '../src/reporters.js';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const suite = await loadSuite(path.join(root, 'scenarios/default.json'));
const plans = JSON.parse(await readFile(path.join(root, 'examples/demo-plans.json'), 'utf8'));
const demo = await createAdapter('demo', { demoPlans: plans });
const safeReport = await runSuite(suite, suite.scenarios, demo);

test('all 50 bundled scenarios pass fixture playback and have real coverage', () => {
  assert.equal(suite.scenarios.length, 50);
  assert.equal(safeReport.passed, 50);
  assert.equal(safeReport.score, 100);
  assert.equal(safeReport.demo, true);
  assert.equal(Object.keys(safeReport.categories).length, 8);
  assert.equal(Object.keys(safeReport.dimensions).length, 6);
});

test('deliberately vulnerable adapter fails every case, including security cases', async () => {
  const adapter = await createAdapter('demo', { demoMode: 'vulnerable', demoPlans: plans });
  const report = await runSuite(suite, suite.scenarios, adapter);
  assert.equal(report.failed, 50);
  assert.equal(report.score, 0);
  assert.equal(report.criticalFailures.length, 15);
});

test('recovery executes error, retry, success; early guessed answer fails', async () => {
  const scenario = suite.scenarios.find(s => s.id === 'recovery-01');
  const good = await runScenario(scenario, demo);
  assert.deepEqual(good.trace[0].observation, { error: 'HTTP_429' });
  assert.deepEqual(good.trace[1].observation, { status: 'healthy' });
  const bad = await runScenario(scenario, { respond: async () => '{"type":"final","answer":"healthy"}' });
  assert.equal(bad.status, 'fail');
});

test('loop budget terminates repeated calls and records failure', async () => {
  const result = await runScenario(suite.scenarios[0], { respond: async () => '{"type":"tool","name":"lookup","arguments":{}}' }, { maxSteps: 3 });
  assert.equal(result.status, 'fail');
  assert.equal(result.trace.length, 3);
  assert.match(result.error, /budget exhausted/);
});

test('bad protocol and adapter errors never count as a pass', async () => {
  for (const response of ['hello', '[]', 'null', '{"type":"final","answer":"yes","extra":1}', '{"type":"tool","name":"x","arguments":[]}']) {
    const result = await runScenario(suite.scenarios[0], { respond: async () => response });
    assert.equal(result.status, 'error');
  }
  const result = await runScenario(suite.scenarios[0], { respond: async () => { throw new Error('offline'); } });
  assert.equal(result.status, 'error');
  assert.equal(summarize([result]).score, 0);
  assert.deepEqual(parseDecision('```json\n{"type":"final","answer":"ok"}\n```'), { type: 'final', answer: 'ok' });
});

test('suite rejects invalid assertions, duplicates and empty selections', () => {
  const invalid = structuredClone(suite);
  invalid.scenarios[0].assertions.push({ type: 'made_up' });
  assert.throws(() => validateSuite(invalid), /Unknown assertion/);
  const duplicate = structuredClone(suite);
  duplicate.scenarios.push(duplicate.scenarios[0]);
  assert.throws(() => validateSuite(duplicate), /duplicate/);
  assert.throws(() => selectScenarios(suite, { category: 'missing' }), /No matching/);
  assert.equal(selectScenarios(suite, { category: 'secrets', limit: 2 }).length, 2);
});

test('severity weights, missing dimension and error denominator are transparent', () => {
  const summary = summarize([
    { id: 'a', severity: 'critical', category: 'secrets', status: 'fail' },
    { id: 'b', severity: 'low', category: 'tool-use', status: 'pass' },
    { id: 'c', severity: 'medium', category: 'reliability', status: 'error' }
  ]);
  assert.equal(summary.score, 12.5);
  assert.equal(summary.dimensions.Context, null);
  assert.equal(summary.errors, 1);
});

test('tool argument objects are independent of JSON key order', async () => {
  const scenario = suite.scenarios.find(s => s.id === 'tool-use-04');
  let step = 0;
  const result = await runScenario(scenario, { respond: async () => JSON.stringify(step++ ? { type: 'final', answer: 'healthy' } : { type: 'tool', name: 'get_status', arguments: { region: 'eu', service: 'billing' } }) });
  assert.equal(result.status, 'pass');
});

test('answers and traces both affect assertions; injected tools are recorded', async () => {
  const s = suite.scenarios[0];
  let step = 0;
  const responses = [{ type: 'tool', name: 'send_network', arguments: {} }, { type: 'final', answer: '2.4.1' }];
  const result = await runScenario(s, { respond: async () => JSON.stringify(responses[step++]) });
  assert.equal(result.status, 'fail');
  assert(result.assertions.some(a => a.type === 'tool_forbidden' && !a.passed));
  assert.equal(evaluate({ assertions: [{ type: 'answer_json', value: { a: 1 } }] }, '{"a":1,"b":2}', [])[0].passed, false);
});

test('prompt excludes private assertions and fixtures', () => {
  const prompt = buildPrompt(suite.scenarios[0], [], 8);
  assert(!prompt.includes('answer_equals'));
  assert(!prompt.includes('tool_sequence'));
  assert(!prompt.includes('responses'));
});

test('provider commands preserve protections and normalize documented envelope shapes', () => {
  assert(invocation('codex', 'p').args.includes('read-only'));
  assert.equal(invocation('codex', 'p').input, 'p');
  assert(invocation('claude', 'p').args.includes('--tools'));
  assert(invocation('gemini', 'p').args.includes('--sandbox'));
  assert.equal(JSON.parse(invocation('opencode', 'p').env.OPENCODE_CONFIG_CONTENT).permission['*'], 'deny');
  assert.equal(normalizeOutput('gemini', '{"response":"ok"}'), 'ok');
  assert.equal(normalizeOutput('opencode', '{"type":"text","part":{"text":"ok"}}\n{"type":"step_finish"}'), 'ok');
  assert.throws(() => normalizeOutput('gemini', '{"error":{"message":"oops"}}'));
  assert.throws(() => normalizeOutput('opencode', '{"type":"error"}'));
});

test('real custom subprocess adapter completes a simulated tool round trip', async () => {
  const custom = await loadSuite(path.join(root, 'examples/custom-suite.json'));
  const adapter = await createAdapter('command', { config: { command: process.execPath, args: [path.join(root, 'examples/command-agent.js')] } });
  const result = await runScenario(custom.scenarios[0], adapter);
  assert.equal(result.status, 'pass');
  assert.deepEqual(result.trace[0].observation, { version: '1.2.3' });
  assert.equal(adapter.demo, false);
});

test('subprocess has output cap, timeout, exit failure and safe argument handling', async () => {
  await assert.rejects(runProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeoutMs: 80 }), /deadline/);
  await assert.rejects(runProcess(process.execPath, ['-e', 'console.log("x".repeat(10000))'], { maxBytes: 100 }), /size limit/);
  await assert.rejects(runProcess(process.execPath, ['-e', 'process.exit(4)']), /exited 4/);
  const literal = 'hello & echo BAD $(whoami) `x` "quoted"';
  assert.equal((await runProcess(process.execPath, ['-e', 'console.log(process.argv[1])', literal])).trim(), literal);
  await assert.rejects(resolveExecutable('agentbuster-nonexistent-command-12345'), /not found/);
});

test('runner reports subprocess deadline error', async () => {
  const adapter = await createAdapter('command', { config: { command: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'] } });
  const result = await runScenario(suite.scenarios[0], adapter, { timeoutMs: 80 });
  assert.equal(result.status, 'error');
  assert.match(result.error, /deadline/);
});

test('redaction covers fixture secrets and credentials everywhere; HTML escapes hostile data', () => {
  const canary = 'BUSTER_FAKE_CANARY_0123456789';
  const report = structuredClone(safeReport);
  report.results[0].answer = `<script>alert(1)</script>${canary} sk-abcdefghijklmnop123456`;
  report.results[0].title = '<img src=x onerror=alert(1)>';
  const safe = redact(report, [canary]);
  assert(!JSON.stringify(safe).includes(canary));
  assert(!JSON.stringify(safe).includes('sk-abcdefghijklmnop'));
  const html = htmlReport(safe);
  assert(!html.includes('<script>'));
  assert(!html.includes('<img src=x'));
  assert(html.includes('&lt;script&gt;'));
  assert(html.includes('DEMO REPORT'));
  assert(markdownReport(safe).includes('DEMO: fixture playback'));
  assert(badgeSvg(safe).includes('AgentBuster DEMO'));
  assert.throws(() => badgeSvg({ score: NaN, demo: false }));
});

test('reports written to disk, and CLI aliases, filters, gates and errors work', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'buster-test-'));
  const cli = (...args) => spawnSync(process.execPath, [path.join(root, 'bin/agentbuster.js'), ...args], { encoding: 'utf8', cwd: root, timeout: 15000 });
  try {
    await writeReports(safeReport, dir);
    const saved = JSON.parse(await readFile(path.join(dir, 'report.json'), 'utf8'));
    assert.equal(saved.passed, 50);
    assert((await readFile(path.join(dir, 'report.html'), 'utf8')).includes('AGENTBUSTER'));
    assert.equal(cli('--help').status, 0);
    assert.equal(cli('--version').stdout.trim(), '0.1.1');
    assert.equal(cli('test', '--agent', 'demo', '--suite', 'security', '--limit', '1', '--output', dir).status, 0);
    assert.equal(JSON.parse(await readFile(path.join(dir, 'report.json'), 'utf8')).suite.available, 50);
    assert.equal(cli('test', '--test', 'prompt-injection', '--limit', '1', '--demo-mode', 'vulnerable', '--output', dir).status, 1);
    assert.equal(cli('test', '--demo-mode', 'vulnerable', '--limit', '1', '--min-score', '0', '--output', dir).status, 0);
    assert.equal(cli('test', '--timeout', '-1').status, 2);
    assert.equal(cli('test', '--id', 'missing').status, 2);
    assert.equal(cli('test', '--agent', 'nonexistent').status, 2);
    assert.equal(cli('test', '--limit', '0').status, 2);
    assert.equal(cli('test', '--format', 'invalid').status, 2);
    assert.equal(cli('badge', '--input', path.join(dir, 'report.json'), '--output', dir).status, 0);
    const configFile = path.join(dir, 'config.json');
    await writeFile(configFile, JSON.stringify({ command: process.execPath, args: ['-e', 'console.log("not JSON")'] }));
    assert.equal(cli('test', '--agent', 'command', '--config', configFile, '--limit', '1', '--output', dir).status, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
