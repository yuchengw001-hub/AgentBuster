// Small stdio test client for the runnable case study and integration tests.
import { spawn } from 'node:child_process';
import { readMessages } from './mcp.js';
import { resolveExecutable } from './process.js';

export async function connectStdio(command, args, { timeoutMs = 5000, signal } = {}) {
  const executable = await resolveExecutable(command);
  const child = spawn(executable.command, [...executable.prefix, ...args], { shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map(); let next = 1, closed = false, closing, diagnostic = '';
  const fail = e => { for (const p of pending.values()) { clearTimeout(p.timer); p.reject(e); } pending.clear(); };
  const abort = () => { fail(new Error('Run cancelled')); close().catch(() => {}); };
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
  function close() {
    if (closing) return closing;
    closing = (async () => {
      fail(new Error('MCP client is closing'));
      if (closed) return exited;
      child.stdin.end();
      let killer, forceTimer, deadlineTimer;
      const force = () => {
        if (closed || !child.pid) return;
        if (process.platform === 'win32') {
          killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
          killer.on('error', () => child.kill());
          killer.on('close', () => child.kill());
        } else {
          try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
        }
      };
      try {
        forceTimer = setTimeout(force, 1000);
        return await Promise.race([exited, new Promise((_, reject) => {
          deadlineTimer = setTimeout(() => {
            child.kill();
            child.stdin.destroy(); child.stdout.destroy(); child.stderr.destroy();
            child.unref();
            reject(new Error('MCP process did not close after forced termination'));
          }, 3000);
        })]);
      } finally {
        clearTimeout(forceTimer); clearTimeout(deadlineTimer);
        killer?.kill();
        signal?.removeEventListener('abort', abort);
      }
    })();
    return closing;
  }
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('Run cancelled')); return; }
    if (closed || closing) { reject(new Error('MCP process is closed')); return; }
    const id = next++;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`MCP client deadline: ${method}`)); }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  return { request, notify(method, params = {}) { child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n'); },
    close };
}
