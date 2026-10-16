import { execFileSync } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
const problems = [];
const credentials = /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|sk-[A-Za-z0-9_-]{20,})\b/;
for (const file of files) {
  if (/^(?:reports|node_modules|\.package-test)\//.test(file) || /(?:^|\/)\.env(?:\.|$)|\.(?:pem|key|p12)$/i.test(file)) problems.push(`Excluded/private file would be published: ${file}`);
  if (!/\.(?:md|js|json|ya?ml|css|html|cmd)$/.test(file)) continue;
  const text = await readFile(file, 'utf8');
  if (!file.startsWith('test/') && credentials.test(text)) problems.push(`Credential-like content requires review: ${file}`);
  if (!file.endsWith('.md')) continue;
  const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  for (const match of prose.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    try { await access(resolved); } catch { problems.push(`Broken local documentation link: ${file} -> ${target}`); }
  }
}
for (const required of ['README.md', 'README.zh-CN.md', 'LICENSE', 'SECURITY.md', 'CHANGELOG.md', 'ui/index.html', 'docs/QUICKSTART.md', 'docs/RELEASE-v0.1.0.md']) if (!files.includes(required)) problems.push(`Missing release file: ${required}`);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
if (pkg.dependencies && Object.keys(pkg.dependencies).length) problems.push('Review added runtime dependencies before release');
if (problems.length) { for (const problem of problems) console.error(problem); process.exitCode = 1; }
else console.log(`PASS: ${files.length} publishable files reviewed; local documentation links resolve; common credential patterns absent outside synthetic tests.`);
