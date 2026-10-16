import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

// Resolve npm's .cmd wrappers without giving prompt text to cmd.exe.
export async function resolveExecutable(command) {
  const dirs = command.includes('/') || command.includes('\\') ? [''] : (process.env.PATH || '').split(path.delimiter);
  const extensions = process.platform === 'win32' ? ['.exe', '.com', '.cmd', '.bat', ''] : [''];
  for (const dir of dirs) for (const ext of extensions) {
    const candidate = path.resolve(dir, command + ext);
    try {
      await access(candidate, process.platform === 'win32' ? constants.F_OK : constants.X_OK);
      if (process.platform === 'win32' && !/\.(exe|com|cmd|bat)$/i.test(candidate)) continue;
      if (/\.(cmd|bat)$/i.test(candidate)) {
        const content = await readFile(candidate, 'utf8');
        const relative = content.match(/%dp0%[\\/]([^"\r\n]+\.(?:js|cjs|mjs))/i)?.[1];
        if (!relative) continue;
        const script = path.resolve(path.dirname(candidate), relative.replaceAll('\\', '/'));
        await access(script);
        return { command: process.execPath, prefix: [script] };
      }
      return { command: candidate, prefix: [] };
    } catch { /* try next PATH entry */ }
  }
  throw new Error(`Executable not found or unsupported wrapper: ${command}. Install its CLI or configure an executable plus arguments.`);
}

export function runProcess(command, args, { cwd, env = {}, input = '', timeoutMs = 60000, maxBytes = 1024 * 1024, signal, onStdout, cooperativeCancel = false } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('Scenario deadline exceeded')); return; }
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: cooperativeCancel ? ['pipe', 'pipe', 'pipe', 'ipc'] : ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', bytes = 0, failure, killFallback, cooperativeTimer;
    const kill = reason => {
      if (failure) return;
      failure = new Error(reason);
      const terminate = () => { if (child.pid) {
        if (process.platform === 'win32') {
          const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
          killer.on('error', () => child.kill());
          killer.on('close', () => child.kill());
          // Restricted Windows hosts can reject taskkill; still terminate the direct child.
          killFallback = setTimeout(() => { child.kill(); killer.kill(); }, 500);
        } else {
          try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
        }
      } };
      if (cooperativeCancel && child.connected) {
        child.send({ type: 'agentbuster-cancel' }, () => {});
        cooperativeTimer = setTimeout(terminate, 1500);
      } else terminate();
    };
    const timer = setTimeout(() => kill('Scenario deadline exceeded'), Math.max(1, timeoutMs));
    const abort = () => kill('Scenario deadline exceeded');
    signal?.addEventListener('abort', abort, { once: true });
    const cleanup = () => { clearTimeout(timer); clearTimeout(killFallback); clearTimeout(cooperativeTimer); signal?.removeEventListener('abort', abort); };
    const collect = (stream, chunk) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxBytes) { kill('Adapter output exceeded size limit'); return; }
      if (stream === 'stdout') { stdout += chunk; onStdout?.(chunk); } else stderr += chunk;
    };
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', c => collect('stdout', c)); child.stderr.on('data', c => collect('stderr', c));
    child.on('error', e => { cleanup(); reject(e); });
    child.on('close', code => {
      cleanup();
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error(`Adapter exited ${code}: ${stderr.slice(0, 1000)}`));
      else resolve(stdout);
    });
    child.stdin.on('error', () => { /* EPIPE: close handler provides actual outcome */ });
    child.stdin.end(input);
  });
}
