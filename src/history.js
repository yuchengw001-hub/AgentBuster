import { isDeepStrictEqual } from 'node:util';

export function validateReport(r) {
  if (!r || r.schemaVersion !== 1 || typeof r.demo !== 'boolean' || !r.suite?.fingerprint || !Array.isArray(r.suite.ids) || !r.limits || !Array.isArray(r.results) || !r.results.length) throw new Error('Expected an AgentBuster report with scenario evidence');
  if (r.suite.ids.some(id => typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) || new Set(r.suite.ids).size !== r.suite.ids.length || !Number.isFinite(r.score) || r.score < 0 || r.score > 100) throw new Error('Invalid report IDs or score');
  for (const row of r.results) {
    if (!row || !r.suite.ids.includes(row.id) || !['pass', 'fail', 'error'].includes(row.status) || !Array.isArray(row.trace) || !Array.isArray(row.assertions)) throw new Error('Invalid report result');
  }
  return r;
}

export function compareReports(before, after) {
  validateReport(before); validateReport(after);
  const incompatible = [];
  for (const [name, left, right] of [
    ['suite fingerprint', before.suite.fingerprint, after.suite.fingerprint],
    ['selected scenarios', before.suite.ids, after.suite.ids],
    ['execution limits', before.limits, after.limits],
    ['adapter', before.adapter, after.adapter],
    ['model', before.model, after.model],
    ['demo/real mode', before.demo, after.demo],
    ['repeat count', before.repeats || 1, after.repeats || 1]
  ]) if (!isDeepStrictEqual(left, right)) incompatible.push(name);
  if (incompatible.length) throw new Error(`Reports are not comparable: ${incompatible.join(', ')}`);
  const counts = (report, id) => {
    const rows = report.results.filter(r => r.id === id);
    return { pass: rows.filter(r => r.status === 'pass').length, fail: rows.filter(r => r.status === 'fail').length, error: rows.filter(r => r.status === 'error').length };
  };
  const changes = before.suite.ids.map(id => {
    const a = counts(before, id), b = counts(after, id);
    if (a.pass + a.fail + a.error !== (before.repeats || 1) || b.pass + b.fail + b.error !== (after.repeats || 1)) throw new Error(`Incomplete repeat evidence: ${id}`);
    return { id, before: a, after: b, regression: b.pass < a.pass || b.error > a.error, improvement: b.pass > a.pass && b.error <= a.error };
  });
  return { schemaVersion: 1, demo: after.demo, beforeScore: before.score, afterScore: after.score, delta: Math.round((after.score - before.score) * 10) / 10,
    regressions: changes.filter(c => c.regression), improvements: changes.filter(c => c.improvement), errors: after.results.filter(r => r.status === 'error').length, changes,
    note: 'Observed changes, not statistical significance. Repeat under matching conditions before concluding a model regressed.' };
}

export function comparisonMarkdown(c) {
  return `# AgentBuster ${c.demo ? 'DEMO ' : ''}comparison\n\nScore: ${c.beforeScore} → ${c.afterScore} (${c.delta >= 0 ? '+' : ''}${c.delta})\n\n${c.regressions.length} observed regressions · ${c.improvements.length} improvements · ${c.errors} candidate errors\n\n| Scenario | Baseline pass/fail/error | Candidate pass/fail/error | Change |\n| --- | --- | --- | --- |\n${c.changes.map(x => `| ${x.id} | ${x.before.pass}/${x.before.fail}/${x.before.error} | ${x.after.pass}/${x.after.fail}/${x.after.error} | ${x.regression ? 'REGRESSION' : x.improvement ? 'improved' : 'unchanged'} |`).join('\n')}\n\n${c.note}\n`;
}

export function replayText(report, id) {
  validateReport(report);
  const rows = report.results.filter(r => r.id === id);
  if (!rows.length) throw new Error(`Scenario not found in report: ${id}`);
  const text = [`AgentBuster ${report.demo ? 'DEMO ' : ''}recorded evidence — ${id}`, 'Offline inspection; no agent is invoked and no tools are executed.'];
  for (const row of rows) {
    text.push(`\nTrial ${row.trial || 1}: ${row.status.toUpperCase()}`);
    row.trace.forEach((event, i) => text.push(`${i + 1}. ${event.type === 'tool' ? `${event.name} ${JSON.stringify(event.arguments)}\n   ← ${JSON.stringify(event.observation)}` : `FINAL ${event.answer}`}`));
    for (const a of row.assertions.filter(a => !a.passed)) text.push(`FAILED ASSERTION: ${JSON.stringify(a)}`);
    if (row.error) text.push(`ERROR: ${row.error}`);
  }
  return text.join('\n');
}
