// Small stdio test client for the runnable case study and integration tests.
import { spawn } from 'node:child_process';
import { readMessages } from './mcp.js';
import { resolveExecutable } from './process.js';

export async function connectStdio(command, args, { timeoutMs = 5000, signal } = {}) {
  const executable = await resolveExecutable(command);
  const child = spawn(executable.command, [...executable.prefix, ...args], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map(); let next = 1, closed = false, diagnostic = '';
  const fail = e => { for (const p of pending.values()) { clearTimeout(p.timer); p.reject(e); } pending.clear(); };
  const abort = () => { fail(new Error('Run cancelled')); child.stdin.end(); };
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  child.on('error', fail);
  child.stdin.on('error', fail);
  child.stderr.setEncoding('utf8'); child.stderr.on('data', c => { diagnostic = (diagnostic + c).slice(-1000); });
  readMessages(child.stdout, message => {
    const entry = pending.get(message.id);
    if (!entry || message.method) return;
    pending.delete(message.id); clearTimeout(entry.timer);
    if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result);
  }, fail);
  const exited = new Promise(resolve => child.on('close', (code, signal) => { closed = true; fail(new Error(`MCP process closed (${code ?? signal}): ${diagnostic}`)); resolve(code); }));
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('Run cancelled')); return; }
    if (closed) { reject(new Error('MCP process is closed')); return; }
    const id = next++;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`MCP client deadline: ${method}`)); }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  return { request, notify(method, params = {}) { child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n'); },
    async close() {
      if (!closed) child.stdin.end();
      const timer = setTimeout(() => child.kill(), 1000);
      const code = await exited; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      return code;
    } };
}
