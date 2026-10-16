import { spawn } from 'node:child_process';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { resolveExecutable } from './process.js';
import { redact } from './reporters.js';

const MAX_LINE = 1024 * 1024;
export function readMessages(stream, onMessage, onError) {
  let buffer = '';
  stream.setEncoding('utf8');
  stream.on('data', chunk => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
      if (Buffer.byteLength(line) > MAX_LINE) { onError(new Error('MCP message exceeds 1 MiB')); return; }
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line);
        if (!message || Array.isArray(message) || message.jsonrpc !== '2.0') throw new Error('Expected single JSON-RPC 2.0 object');
        onMessage(message);
      } catch (e) { onError(e); return; }
    }
    if (Buffer.byteLength(buffer) > MAX_LINE) onError(new Error('MCP message exceeds 1 MiB'));
  });
  stream.on('end', () => { if (buffer.trim()) onError(new Error('Truncated MCP message: expected newline delimiter')); });
}

export function validateProxyConfig(config) {
  if (!config || typeof config.server?.command !== 'string' || !Array.isArray(config.server.args) || config.server.args.some(a => typeof a !== 'string') || !Array.isArray(config.faults)) throw new Error('MCP config needs server:{command,args} and faults:[]');
  if (config.timeoutMs !== undefined && (!Number.isInteger(config.timeoutMs) || config.timeoutMs < 10 || config.timeoutMs > 3600000)) throw new Error('MCP timeoutMs must be 10..3600000');
  if (config.captureContent !== undefined && typeof config.captureContent !== 'boolean') throw new Error('captureContent must be boolean');
  if (config.canaries !== undefined && (!Array.isArray(config.canaries) || config.canaries.some(s => typeof s !== 'string' || s.length < 8))) throw new Error('canaries must contain fake strings of at least 8 characters');
  for (const fault of config.faults) {
    if (!fault || typeof fault.tool !== 'string' || !['error', 'delay', 'inject'].includes(fault.action) || (fault.onCalls !== undefined && (!Array.isArray(fault.onCalls) || !fault.onCalls.length || fault.onCalls.some(n => !Number.isInteger(n) || n < 1)))) throw new Error('Invalid MCP fault: tool, action, optional onCalls:[positive integers]');
    if (fault.action === 'delay' && (!Number.isInteger(fault.delayMs) || fault.delayMs < 1 || fault.delayMs > 60000)) throw new Error('delayMs must be 1..60000');
    if (fault.action === 'inject' && (typeof fault.text !== 'string' || fault.text.length > 100000)) throw new Error('inject requires text (up to 100000 characters)');
    if (fault.action === 'error' && fault.message !== undefined && typeof fault.message !== 'string') throw new Error('error message must be a string');
  }
  return config;
}

export async function startProxy(config, { input = process.stdin, output = process.stdout, diagnostics = process.stderr, traceFile } = {}) {
  validateProxyConfig(config);
  const executable = await resolveExecutable(config.server.command);
  if (traceFile) await mkdir(path.dirname(traceFile), { recursive: true });
  const child = spawn(executable.command, [...executable.prefix, ...config.server.args], { shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map(), upstreamIds = new Map(), counts = new Map();
  const timeoutMs = config.timeoutMs || 30000;
  let ended = false, inputEnded = false, traceBytes = 0, writeChain = Promise.resolve(), closeTimer, nextId = 0;
  const sessionId = randomUUID();
  const log = event => {
    const line = JSON.stringify(redact({ sessionId, timestamp: new Date().toISOString(), ...event }, config.canaries || [])) + '\n';
    traceBytes += Buffer.byteLength(line);
    if (traceBytes > 16 * 1024 * 1024) { fail(new Error('MCP trace exceeds 16 MiB')); return; }
    if (traceFile) writeChain = writeChain.then(() => appendFile(traceFile, line));
    // Attach a rejection handler immediately; completion still awaits the original chain.
    writeChain.catch(e => fail(e));
  };
  const send = message => {
    if (output.writableLength > 2 * MAX_LINE) { fail(new Error('MCP client is not consuming output')); return; }
    if (!ended && !output.destroyed) output.write(JSON.stringify(message) + '\n');
  };
  let resolveDone, rejectDone;
  const done = new Promise((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
  function shutdown() {
    if (inputEnded && pending.size === 0 && !ended && !closeTimer) {
      child.stdin.end();
      closeTimer = setTimeout(() => fail(new Error('MCP upstream did not exit after input closed')), 1500);
    }
  }
  function finish(record, response, status) {
    if (!pending.has(record.id)) return;
    clearTimeout(record.timer); clearTimeout(record.delay);
    pending.delete(record.id);
    upstreamIds.delete(record.upstreamId);
    log({ type: 'response', id: record.id, method: record.method, tool: record.tool, status, fault: record.fault?.action, call: record.call, durationMs: Date.now() - record.started,
      ...(config.captureContent ? { message: response } : {}) });
    send(response); shutdown();
  }
  function fail(error) {
    if (ended) return;
    ended = true;
    clearTimeout(closeTimer); input.pause();
    for (const record of pending.values()) { clearTimeout(record.timer); clearTimeout(record.delay); }
    pending.clear(); upstreamIds.clear();
    if (child.pid && process.platform !== 'win32') {
      try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill(); }
    } else {
      const killer = child.pid ? spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }) : undefined;
      killer?.on('error', () => child.kill()); killer?.on('close', () => child.kill());
      const fallback = setTimeout(() => { child.kill(); killer?.kill(); }, 500);
      child.once('close', () => clearTimeout(fallback));
    }
    rejectDone(error);
  }
  log({ type: 'session', transport: 'stdio', scope: 'real MCP tool traffic; not agent task grading', captureContent: !!config.captureContent });
  child.stderr.on('data', () => { /* Do not echo or retain possibly sensitive upstream diagnostics. */ });
  child.stdin.on('error', e => { if (!inputEnded) fail(e); });
  child.on('error', fail);
  output.on('error', fail);
  const inputMessage = message => {
    if (ended) return;
    if (!Object.hasOwn(message, 'id') || !message.method) {
      if (message.method === 'notifications/cancelled' && pending.has(message.params?.requestId)) message = { ...message, params: { ...message.params, requestId: pending.get(message.params.requestId).upstreamId } };
      child.stdin.write(JSON.stringify(message) + '\n'); return;
    }
    if ((typeof message.id !== 'string' && typeof message.id !== 'number') || pending.has(message.id)) { fail(new Error('Invalid or duplicate in-flight request ID')); return; }
    if (pending.size >= 128) { fail(new Error('Too many in-flight MCP requests')); return; }
    const tool = message.method === 'tools/call' ? message.params?.name : undefined;
    const call = tool ? (counts.get(tool) || 0) + 1 : undefined;
    if (tool) counts.set(tool, call);
    const fault = tool ? config.faults.find(f => (f.tool === tool || f.tool === '*') && (!f.onCalls || f.onCalls.includes(call))) : undefined;
    const record = { id: message.id, upstreamId: `agentbuster:${sessionId}:${++nextId}`, method: message.method, tool, call, fault, started: Date.now() };
    pending.set(message.id, record);
    upstreamIds.set(record.upstreamId, record);
    const forwarded = { ...message, id: record.upstreamId };
    log({ type: 'request', id: message.id, method: message.method, tool, call, fault: fault?.action, ...(config.captureContent ? { message } : {}) });
    record.timer = setTimeout(() => finish(record, { jsonrpc: '2.0', id: message.id, error: { code: -32000, message: 'AgentBuster upstream deadline exceeded' } }, 'timeout'), timeoutMs);
    if (fault?.action === 'error') {
      finish(record, { jsonrpc: '2.0', id: message.id, result: { isError: true, content: [{ type: 'text', text: fault.message || 'AgentBuster injected transient tool failure' }] } }, 'injected-error');
    } else if (fault?.action === 'delay') {
      record.delay = setTimeout(() => { if (pending.has(record.id)) child.stdin.write(JSON.stringify(forwarded) + '\n'); }, fault.delayMs);
    } else child.stdin.write(JSON.stringify(forwarded) + '\n');
  };
  const serverMessage = message => {
    if (ended) return;
    if (message.method) { send(message); return; } // Server requests/notifications are transparent.
    const record = upstreamIds.get(message.id);
    if (!record) return; // Drop late responses after a proxy timeout.
    message = { ...message, id: record.id };
    if (record.fault?.action === 'inject' && message.result && Array.isArray(message.result.content)) {
      message.result.content.push({ type: 'text', text: record.fault.text });
      // structuredContent is retained: injection is an additional untrusted text block.
    }
    finish(record, message, message.error || message.result?.isError ? 'upstream-error' : 'ok');
  };
  readMessages(input, inputMessage, fail);
  readMessages(child.stdout, serverMessage, fail);
  input.on('error', fail);
  input.on('end', () => { inputEnded = true; shutdown(); });
  child.on('close', code => {
    clearTimeout(closeTimer);
    if (ended) return;
    if (pending.size || code !== 0 || !inputEnded) { fail(new Error(`MCP upstream exited unexpectedly (${code})`)); return; }
    log({ type: 'session-end', calls: Object.fromEntries(counts), exitCode: code });
    ended = true;
    writeChain.then(resolveDone, rejectDone);
  });
  const stop = () => { inputEnded = true; for (const r of pending.values()) finish(r, { jsonrpc: '2.0', id: r.id, error: { code: -32000, message: 'Proxy stopping' } }, 'cancelled'); child.stdin.end(); };
  diagnostics.write('AgentBuster MCP proxy ready (stdio; diagnostics only on stderr).\n');
  return { done, stop, child };
}
