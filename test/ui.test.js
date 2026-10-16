import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createUiServer } from '../src/ui-server.js';
import { resolveExecutable, runProcess } from '../src/process.js';
import { writeFile } from 'node:fs/promises';

async function withConsole(fn) {
  const directory = await mkdtemp(path.join(tmpdir(), 'agentbuster-ui-'));
  const app = await createUiServer({ outputDir: directory });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  const home = await (await fetch(origin)).text();
  const token = home.match(/name="agentbuster-token" content="([a-f0-9]+)"/)[1];
  const api = async (url, data) => {
    const response = await fetch(origin + url, data === undefined ? {} : { method: 'POST', headers: { origin, 'x-agentbuster-token': token, 'content-type': 'application/json' }, body: JSON.stringify(data) });
    return { status: response.status, data: await response.json() };
  };
  const wait = async id => {
    for (let i = 0; i < 150; i++) {
      const state = (await api('/api/state')).data;
      const job = state.jobs.find(j => j.id === id);
      if (job && !['running', 'cancelling'].includes(job.status)) return job;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    throw new Error('Console job did not finish');
  };
  try { await fn({ app, origin, token, api, wait, home }); }
  finally { await app.stop(); await rm(directory, { recursive: true, force: true }); }
}
const settings = { agent: 'demo', suite: 'recovery', limit: 5, repeat: 1, timeoutMs: 15000, model: '' };

test('interactive console runs a job and serves its own report and downloads', () => withConsole(async ({ origin, api, wait, home }) => {
  assert(home.includes('Start test')); assert(home.includes('value="en"'));
  assert.equal((await fetch(origin + '/app.js')).status, 200);
  const created = await api('/api/jobs', settings); assert.equal(created.status, 202);
  const job = await wait(created.data.id);
  assert.equal(job.status, 'completed'); assert.equal(job.summary.passed, 5); assert.equal(job.done, 5);
  assert(job.log.includes('PASS'));
  const report = await fetch(`${origin}/runs/${job.id}/report.html?lang=zh-CN`);
  assert.equal(report.status, 200); assert((await report.text()).includes('DEMO REPORT'));
  const json = await (await fetch(`${origin}/runs/${job.id}/report.json`)).json(); assert.equal(json.passed, 5);
  assert.equal((await fetch(`${origin}/runs/${job.id}/badge.svg`)).status, 200);
  assert.equal((await fetch(`${origin}/runs/${job.id}/job.json`)).status, 404);
}));

test('console rejects cross-origin launches, absent tokens and arbitrary commands', () => withConsole(async ({ origin, token, api }) => {
  const send = headers => fetch(origin + '/api/jobs', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(settings) });
  assert.equal((await send({ origin: 'https://example.invalid', 'x-agentbuster-token': token })).status, 403);
  assert.equal((await send({ origin })).status, 403);
  assert.equal((await send({ 'x-agentbuster-token': token })).status, 403);
  assert.equal((await api('/api/jobs', { ...settings, agent: 'command', command: 'anything' })).status, 400);
  assert.equal((await api('/api/jobs', { ...settings, suite: '../../private' })).status, 400);
  assert.equal((await api('/api/jobs', { ...settings, agent: 'codex', allowPaid: false })).status, 400);
  assert.equal((await api('/api/jobs', { ...settings, limit: 999999 })).status, 400);
  assert.equal((await fetch(origin + '/api/state', { headers: { origin: 'https://example.invalid' } })).status, 403);
}));

test('console supports cancellation and prevents concurrent model jobs', () => withConsole(async ({ api, wait }) => {
  const first = await api('/api/jobs', { ...settings, agent: 'showcase' });
  assert.equal(first.status, 202);
  assert.equal((await api('/api/jobs', settings)).status, 409);
  assert.equal((await api(`/api/jobs/${first.data.id}/cancel`, {})).status, 202);
  const stopped = await wait(first.data.id);
  assert.equal(stopped.status, 'cancelled'); assert(!stopped.summary);
}));

test('simultaneous launch requests reserve a single worker before any asynchronous setup', () => withConsole(async ({ api, wait }) => {
  const responses = await Promise.all([api('/api/jobs', { ...settings, agent: 'showcase' }), api('/api/jobs', { ...settings, agent: 'showcase' })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [202, 409]);
  const accepted = responses.find(r => r.status === 202);
  await wait(accepted.data.id);
}));

test('console runs real MCP showcase and compares compatible history', () => withConsole(async ({ origin, api, wait }) => {
  const showcase = await api('/api/jobs', { ...settings, agent: 'showcase' });
  const shown = await wait(showcase.data.id); assert.equal(shown.improvements, 2);
  assert.equal((await fetch(`${origin}/runs/${shown.id}/broken/report.html`)).status, 200);
  assert.equal((await fetch(`${origin}/runs/${shown.id}/comparison.md`)).status, 200);
  const base = await api('/api/jobs', settings); const before = await wait(base.data.id);
  const after = await api('/api/jobs', { ...settings, baselineId: before.id }); const compared = await wait(after.data.id);
  assert.equal(compared.comparison.regressions, 0); assert.equal(compared.comparison.delta, 0);
  const incompatible = await api('/api/jobs', { ...settings, suite: 'security', baselineId: before.id });
  assert.match((await wait(incompatible.data.id)).comparisonError, /not comparable/);
}));

test('managed job cancellation reaches the worker through IPC before forced termination', async () => {
  const abort = new AbortController(); let output = '';
  const running = runProcess(process.execPath, ['-e', 'process.on("message", m=>{if(m.type==="agentbuster-cancel"){console.log("stopped cooperatively");process.exit(0)}});console.log("ready");setInterval(()=>{},1000)'], {
    cooperativeCancel: true, signal: abort.signal, onStdout(chunk) { output += chunk; if (chunk.includes('ready')) abort.abort(); }
  });
  await assert.rejects(running);
  assert(output.includes('stopped cooperatively'));
});

test('Windows npm shim resolution ignores an adjacent extensionless shell script', { skip: process.platform !== 'win32' }, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'agentbuster-shim-'));
  try {
    await writeFile(path.join(dir, 'sample'), '#!/bin/sh\n');
    await writeFile(path.join(dir, 'sample.cmd'), '@echo off\n"%dp0%\\entry.js" %*\n');
    await writeFile(path.join(dir, 'entry.js'), 'console.log("ok")');
    const resolved = await resolveExecutable(path.join(dir, 'sample'));
    assert.equal(resolved.command, process.execPath); assert.deepEqual(resolved.prefix, [path.join(dir, 'entry.js')]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
