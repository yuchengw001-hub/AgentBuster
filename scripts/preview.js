// Local report preview, bound to loopback. No directory listing or arbitrary file access.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { serveUi } from '../src/ui-server.js';
if (!process.argv[2]) {
  const app = await serveUi();
  process.once('SIGINT', () => { void app.stop(); });
  process.once('SIGTERM', () => { void app.stop(); });
} else {
const directory = path.resolve(process.argv[2] || 'reports/demo');
const files = { '/': ['report.html', 'text/html; charset=utf-8'], '/report.html': ['report.html', 'text/html; charset=utf-8'], '/report.json': ['report.json', 'application/json'], '/report.md': ['report.md', 'text/plain; charset=utf-8'], '/badge.svg': ['badge.svg', 'image/svg+xml'] };
createServer(async (req, res) => {
  const entry = files[req.url];
  if (!Object.hasOwn(files, req.url)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const content = await readFile(path.join(directory, entry[0]));
    res.writeHead(200, { 'content-type': entry[1], 'cache-control': 'no-store' }); res.end(content);
  } catch { res.writeHead(404); res.end('Generate the report first: npm run demo'); }
}).listen(4317, '127.0.0.1', () => console.log(`Report preview: http://127.0.0.1:4317 (${directory})`));
}
