import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { languageScript } from './locales.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const md = value => escapeHtml(value).replaceAll('|', '\\|').replaceAll('\n', ' ');

export function redact(report, canaries = []) {
  let text = JSON.stringify(report);
  for (const canary of [...new Set(canaries)].sort((a, b) => b.length - a.length)) {
    text = text.replaceAll(JSON.stringify(canary).slice(1, -1), '[REDACTED_CANARY]');
  }
  text = text.replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{16,}|AKIA[A-Z0-9]{16})\b/g, '[REDACTED_CREDENTIAL]');
  return JSON.parse(text);
}

export function badgeSvg(report) {
  if (!Number.isFinite(report.score) || report.score < 0 || report.score > 100 || typeof report.demo !== 'boolean') throw new Error('Badge requires report score 0–100 and explicit demo flag');
  const label = report.demo ? 'AgentBuster DEMO' : 'AgentBuster';
  const right = `${report.score}/100${report.errors ? ' ERROR' : ''}`;
  const leftWidth = report.demo ? 135 : 100, rightWidth = report.errors ? 105 : 80;
  const color = report.errors ? '#737d8c' : report.score >= 90 ? '#167d59' : report.score >= 70 ? '#ad6605' : '#c43f50';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${leftWidth + rightWidth}" height="24" role="img" aria-label="${label}: ${escapeHtml(right)}"><title>${label}: ${escapeHtml(right)}</title><rect width="100%" height="24" rx="4" fill="#253246"/><path d="M${leftWidth} 0h${rightWidth}v24h-${rightWidth}z" fill="${color}"/><g fill="white" text-anchor="middle" font-family="Verdana,sans-serif" font-size="11"><text x="${leftWidth / 2}" y="16">${label}</text><text x="${leftWidth + rightWidth / 2}" y="16">${escapeHtml(right)}</text></g></svg>\n`;
}

export function markdownReport(r) {
  return `# AgentBuster ${r.demo ? 'DEMO ' : ''}Report

**Agent Score: ${r.score}/100** · ${md(r.adapter)} · ${md(r.model)}

${md(r.scope)}

${r.passed} passed · ${r.failed} failed · ${r.errors} errors · coverage ${r.suite.selected}/${r.suite.available}

${r.demo ? r.demoKind === 'scripted-mcp' ? '**DEMO: deterministic example clients using real MCP transport, not an LLM evaluation.**\n' : '**DEMO: fixture playback, not a real agent evaluation.**\n' : ''}
Trials per scenario: ${r.repeats || 1}. Pass/fail/error counts refer to trials.
| Dimension | Score |
| --- | ---: |
${Object.entries(r.dimensions).map(([name, score]) => `| ${md(name)} | ${score ?? 'N/A'} |`).join('\n')}

## Findings

${r.results.filter(x => x.status !== 'pass').map(x => `- **${md(x.severity.toUpperCase())} / ${md(x.status)}** ${md(x.id)}: ${md(x.title)}${x.error ? ` — ${md(x.error)}` : ''}`).join('\n') || 'No failures observed in the selected scenarios.'}

## Tests

| ID | Category | Severity | Result | ms |
| --- | --- | --- | --- | ---: |
${r.results.map(x => `| ${md(x.id)} | ${md(x.category)} | ${md(x.severity)} | ${md(x.status)} | ${x.durationMs} |`).join('\n')}

## Reproduce

- Suite SHA-256: ${md(r.suite.fingerprint)}
- Started: ${md(r.startedAt)}
- Limits: ${r.limits.timeoutMs} ms/scenario; ${r.limits.maxSteps} decisions/scenario.
- Selection: ${r.suite.ids.map(md).join(', ')}
- Scores use severity weights low=1, medium=2, high=3, critical=5. Errors earn zero.
- Dimensions overlap; they are diagnostic views, not components to average.
- Compare only matching suite, selection, model and limits. Review traces in report.json or report.html.
- Credential redaction is best effort. Review artifacts before sharing.

## README badge

Copy badge.svg to your repository and link it to the report:

\`[![AgentBuster ${r.demo ? 'DEMO ' : ''}Score](./badge.svg)](./report.md)\`
`;
}

export function htmlReport(r) {
  const e = escapeHtml;
  const findings = r.results.filter(x => x.status !== 'pass');
  const script = languageScript();
  const scriptHash = createHash('sha256').update(script).digest('base64');
  const t = (key, text = key) => `<span data-i18n="${e(key)}">${e(text)}</span>`;
  const mcpDemo = r.demoKind === 'scripted-mcp';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'"><title>AgentBuster ${r.demo ? 'DEMO ' : ''}Report</title>
<style>
:root{color-scheme:dark;--bg:#0b1019;--panel:#131d2b;--border:#263449;--text:#e8eef8;--muted:#9aabc2;--mint:#62e4ad;--red:#ff8794}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:40px 24px 64px}header{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:1px solid var(--border);padding-bottom:24px}.brand{letter-spacing:.2em;font-size:18px;font-weight:800}.tag,small,.muted{color:var(--muted)}.tag{font-size:12px}h1{font-size:20px;margin:0 0 8px}h2{font-size:18px;margin:32px 0 14px}.pill{border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:12px}.hero{display:grid;grid-template-columns:1fr 2fr;gap:20px;margin-top:28px}.score,.metrics,.finding,details,.banner{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:22px}.number{font-size:76px;font-weight:750;line-height:1.2;letter-spacing:-.06em;color:var(--mint)}.number span{font-size:24px;color:var(--muted);letter-spacing:0}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:20px 28px}.metric-label{display:flex;justify-content:space-between;gap:10px}progress{width:100%;height:6px;accent-color:var(--mint)}.counts{display:flex;flex-wrap:wrap;gap:22px;margin-top:20px}.counts b{font-size:22px}.banner{margin-top:20px;border-color:#9d711f;color:#ffd282}.finding{margin-bottom:10px;padding:16px 20px}.fail,.error{color:var(--red)}.pass{color:var(--mint)}details{padding:14px 18px;margin:8px 0}summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:12px;align-items:center}summary .title{flex:1}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);border-radius:6px;padding:16px;font:12px/1.6 ui-monospace,monospace}footer{border-top:1px solid var(--border);margin-top:32px;padding-top:20px;font-size:12px}code{overflow-wrap:anywhere}a{color:var(--mint)}@media(max-width:700px){.hero{grid-template-columns:1fr}.metrics{grid-template-columns:1fr}header{align-items:flex-start}.number{font-size:64px}}
.header-actions{display:flex;flex-direction:column;align-items:flex-end;gap:10px}.language-control{display:flex;align-items:center;gap:8px;color:var(--text);font-size:13px}.language-control select{background:#20354b;color:#fff;border:1px solid var(--mint);border-radius:8px;padding:10px 30px 10px 12px;font:inherit;min-width:150px;cursor:pointer}.language-control select:focus-visible{outline:3px solid var(--mint);outline-offset:3px}@media(max-width:480px){header{flex-direction:column}.header-actions{align-items:flex-start;width:100%}.language-control{width:100%}.language-control select{flex:1}}
</style></head><body><main>
<header><div><div class="brand">AGENTBUSTER</div><div class="tag">${t('slogan', 'Break your AI Agent before your users do.')}</div></div><div class="header-actions"><label class="language-control" for="report-language"><span aria-hidden="true">🌐</span>${t('language', 'Language')}<select id="report-language" aria-label="Language" data-i18n-aria="language"><option value="en" selected>English</option><option value="zh-CN">简体中文</option><option value="ja">日本語</option><option value="es">Español</option></select></label><span class="pill">${t(mcpDemo ? 'mcpPill' : r.demo ? 'demoPill' : 'realPill', mcpDemo ? 'DEMO · SCRIPTED MCP CLIENTS' : r.demo ? 'DEMO · FIXTURE PLAYBACK' : 'BEHAVIORAL REPORT')}</span></div></header>
${r.demo ? `<div class="banner"><strong>${t('demoTitle', 'DEMO REPORT')}</strong> — ${t(mcpDemo ? 'mcpNote' : 'demoNote', mcpDemo ? 'Deterministic example clients exchange real MCP messages. No LLM is evaluated.' : 'Prerecorded fixture decisions. These scores do not evaluate a real agent.')}</div>` : ''}
<section class="hero"><div class="score"><h1>${t('agentScore', 'Agent Score')}</h1><div class="number">${e(r.score)}<span> / 100</span></div><div class="muted">${e(r.adapter)} · ${e(r.model)}</div><small>${t('coverage', 'Coverage')} ${r.suite.selected} / ${r.suite.available} ${t('scenarios', 'scenarios')}</small></div>
<div class="metrics">${Object.entries(r.dimensions).map(([name, score]) => `<div><div class="metric-label">${t(name)}<b>${score ?? 'N/A'}</b></div><progress max="100" value="${score ?? 0}" aria-label="${e(name)}" data-i18n-aria="${e(name)}"></progress></div>`).join('')}</div></section>
<div class="counts"><span><b class="pass">${r.passed}</b> ${t('passed')}</span><span><b class="fail">${r.failed}</b> ${t('failed')}</span><span><b class="error">${r.errors}</b> ${t('errors')}</span><span><b>${r.criticalFailures.length}</b> ${t('criticalFindings', 'critical findings')}</span></div>
<p class="muted">${t(mcpDemo ? 'mcpScope' : 'scope', r.scope)} ${t('guarantee', 'Scores describe this selection; they are not a security guarantee.')}</p><p class="muted">${t('repeats', 'Trials per scenario')}: ${r.repeats || 1}</p>
<h2>${t('findings', 'Findings')} <span class="muted">/ ${findings.length}</span></h2>
${findings.length ? findings.map(x => `<article class="finding"><span class="pill ${e(x.status)}">${t(x.severity, x.severity.toUpperCase())} · ${t(x.status, x.status.toUpperCase())}</span><p><strong>${t(`case:${x.id}`, x.title)}</strong><br><small>${e(x.id)}${x.error ? ` · ${e(x.error)}` : ''}</small></p><small>${x.assertions.filter(a => !a.passed).map(a => e(a.type)).join(' · ')}</small></article>`).join('') : `<p class="pass">${t('noFailures', 'No failures observed in the selected scenarios.')}</p>`}
<h2>${t('evidence', 'Test evidence')}</h2><p class="muted">${t('evidenceNote', 'Recorded answers and tool observations remain in their original language.')}</p>${r.results.map(x => `<details><summary><span class="${e(x.status)}">${t(x.status, x.status.toUpperCase())}</span><span class="title">${e(x.id)} · ${t(`case:${x.id}`, x.title)}</span><small>${t('trial', 'Trial')} ${x.trial || 1} · ${x.durationMs} ${t('milliseconds', 'ms')}</small></summary><p>${t(x.category)} · ${t(x.severity, x.severity)}</p><pre>${e(JSON.stringify({ answer: x.answer, error: x.error, assertions: x.assertions, trace: x.trace }, null, 2))}</pre></details>`).join('')}
<footer><p>${t('suite', 'Suite')}: ${e(r.suite.name)}<br>SHA-256: <code>${e(r.suite.fingerprint)}</code><br>${e(r.startedAt)} → ${e(r.finishedAt)}<br>${t('limits', 'Limits')}: ${r.limits.timeoutMs} ${t('milliseconds', 'ms')} / ${r.limits.maxSteps} ${t('decisions', 'decisions per scenario')}.</p><p>${t('scoring', 'Severity weights: low 1 · medium 2 · high 3 · critical 5. Errors earn zero. Dimensions overlap; unselected dimensions show N/A.')} ${t('comparison', 'Compare matching suite, selection, model, repeat count and limits.')}</p><p>${t('privacy', 'Redaction is best effort. Review artifacts before sharing.')} <a href="report.json">${t('jsonLink', 'JSON evidence')}</a> · <a href="report.md">${t('mdLink', 'Markdown report')}</a> · <a href="badge.svg">${t('badgeLink', 'README badge')}</a></p></footer>
</main><script type="text/javascript">${script}</script></body></html>`;
}

export async function writeReports(report, outputDir, canaries = [], formats = ['json', 'markdown', 'html']) {
  const safe = redact(report, canaries);
  await mkdir(outputDir, { recursive: true });
  const artifacts = { json: ['report.json', JSON.stringify(safe, null, 2) + '\n'], markdown: ['report.md', markdownReport(safe)], html: ['report.html', htmlReport(safe)] };
  for (const format of formats) {
    const [name, content] = artifacts[format];
    await writeFile(path.join(outputDir, name), content);
  }
  await writeFile(path.join(outputDir, 'badge.svg'), badgeSvg(safe));
  return safe;
}
