#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadSuite, selectScenarios } from '../src/suite.js';
import { createAdapter, adapterNames } from '../src/adapters.js';
import { resolveExecutable } from '../src/process.js';
import { runSuite } from '../src/runner.js';
import { writeReports, badgeSvg, redact } from '../src/reporters.js';
import { compareReports, comparisonMarkdown, replayText } from '../src/history.js';
import { startProxy } from '../src/mcp.js';
import { runShowcase } from '../src/showcase.js';
import { createSetup } from '../src/setup.js';
import { serveUi } from '../src/ui-server.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const runController = new AbortController();
const cancelRun = () => runController.abort();
const cancelMessage = message => { if (message?.type === 'agentbuster-cancel') cancelRun(); };
process.on('message', cancelMessage);
process.on('SIGINT', cancelRun); process.on('SIGTERM', cancelRun);
const help = `AgentBuster — Break your AI Agent before your users do.

Usage:
  agentbuster ui                           Interactive local console
  agentbuster test                         Offline DEMO (no model/account)
  agentbuster test --agent codex           Test installed/authenticated CLI
  agentbuster test --suite security        Security subset
  agentbuster test --test prompt-injection Injection scenarios
  agentbuster list [--category NAME]       List scenarios
  agentbuster doctor                      Check CLI availability (no model calls)
  agentbuster badge --input report.json    Generate badge from an existing report
  agentbuster showcase                    Run real MCP failure-and-fix example (no LLM)
  agentbuster init                        Generate MCP config snippets for four CLIs
  agentbuster mcp --config faults.json     Wrap a real stdio MCP server
  agentbuster compare --baseline before.json --input after.json
  agentbuster replay --input report.json --id recovery-01

Test options:
  --agent, --adapter NAME    demo|codex|claude|gemini|opencode|command
  --suite NAME_OR_FILE      all (default), security, reliability, tools,
                            recovery, context, task-completion, or JSON file
  --test, --category NAME   Filter category (see list)
  --id ID                  Select one scenario
  --limit N                Limit scenario count
  --model NAME             Provider model (otherwise CLI default)
  --timeout MS             Deadline per scenario (default 60000)
  --max-steps N            Decision budget per scenario (default 8)
  --output DIR             Report directory (default reports/latest)
  --format FORMAT          all|json|markdown|html (default all; badge always emitted)
  --min-score N            CI threshold 0–100 (default: any failed case fails)
  --config FILE            Command adapter {"command":"...","args":[...]}
  --demo-mode MODE         safe|vulnerable (fixture playback only)
  --input FILE             badge: report.json input
  --repeat N               Repeat each scenario (default 1; max 20)
  --baseline FILE          Baseline report for compare
  --trace FILE             MCP JSONL trace (default reports/mcp/trace.jsonl)
  --port N                 ui: loopback HTTP port (default 4317)
  --help, --version

Reports measure simulated-tool behavior, not native OS security.
Real adapters may use billable model calls; start with --limit 1.
Exit codes: 0 success, 1 failed cases/score gate, 2 config/adapter/protocol error.
`;
const known = new Set(['agent', 'adapter', 'suite', 'test', 'category', 'id', 'limit', 'model', 'timeout', 'max-steps', 'output', 'format', 'min-score', 'config', 'demo-mode', 'input', 'repeat', 'baseline', 'trace', 'port']);

function parse(args) {
  const options = {};
  let command = args[0]?.startsWith('--') ? 'help' : (args.shift() || 'help');
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') return { command: 'help', options };
    if (arg === '--version') return { command: 'version', options };
    if (!arg.startsWith('--') || !known.has(arg.slice(2))) throw new Error(`Unknown option: ${arg}`);
    const key = arg.slice(2);
    const value = args[++i];
    if (!value || value.startsWith('--') || Object.hasOwn(options, key)) throw new Error(`Missing/duplicate option: ${arg}`);
    options[key] = value;
  }
  if (options.agent && options.adapter) throw new Error('Use either --agent or --adapter');
  if (options.test && options.category) throw new Error('Use either --test or --category');
  return { command, options };
}
function numeric(value, fallback, name, min, max, integer = true) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) throw new Error(`${name} must be ${integer ? 'an integer' : 'a number'} in ${min}..${max}`);
  return number;
}
const presets = {
  all: null, security: ['prompt-injection', 'secrets', 'permissions'],
  reliability: ['reliability', 'loops'], tools: ['tool-use'], recovery: ['recovery'],
  context: ['context'], 'task-completion': ['reliability', 'tool-use', 'recovery']
};

async function main() {
  const { command, options: o } = parse(process.argv.slice(2));
  if (command === 'help') { console.log(help); return 0; }
  if (command === 'version') { console.log('0.1.0'); return 0; }
  if (command === 'ui') {
    const app = await serveUi({ port: numeric(o.port, 4317, 'port', 1, 65535), outputDir: o.output ? path.resolve(o.output) : undefined });
    const stop = () => { void app.stop(); };
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
    return 0;
  }
  if (command === 'init') {
    const output = path.resolve(o.output || 'reports/setup');
    const files = await createSetup(output);
    console.log(`Generated ${files.length} files: ${output}\nStart with README.md. Your existing CLI settings have not been modified.`);
    return 0;
  }
  if (command === 'mcp') {
    if (!o.config) throw new Error('mcp requires --config FILE');
    const config = JSON.parse(await readFile(o.config, 'utf8'));
    const proxy = await startProxy(config, { traceFile: path.resolve(o.trace || 'reports/mcp/trace.jsonl') });
    const stop = () => proxy.stop();
    process.once('SIGTERM', stop); process.once('SIGINT', stop);
    try { await proxy.done; } finally { process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop); }
    return 0;
  }
  if (command === 'showcase') {
    const output = path.resolve(o.output || 'reports/showcase');
    console.log('AgentBuster case study — deterministic clients, real MCP subprocess traffic, no LLM.');
    const { broken, fixed, comparison } = await runShowcase(output, { signal: runController.signal });
    if (runController.signal.aborted) return 130;
    console.log(`Broken client: ${broken.failed} failed / ${broken.errors} errors\nFixed client: ${fixed.passed} passed / ${fixed.errors} errors\nVerified improvements: ${comparison.improvements.length}\nReports: ${output}`);
    return broken.errors || fixed.errors ? 2 : broken.failed === 2 && fixed.passed === 2 ? 0 : 1;
  }
  if (command === 'compare') {
    if (!o.baseline || !o.input) throw new Error('compare requires --baseline FILE and --input FILE');
    const before = JSON.parse(await readFile(o.baseline, 'utf8'));
    const after = JSON.parse(await readFile(o.input, 'utf8'));
    const comparison = compareReports(before, after);
    const output = path.resolve(o.output || 'reports/comparison');
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, 'comparison.json'), JSON.stringify(comparison, null, 2) + '\n');
    const markdown = comparisonMarkdown(comparison);
    await writeFile(path.join(output, 'comparison.md'), markdown);
    console.log(markdown);
    return comparison.errors ? 2 : comparison.regressions.length ? 1 : 0;
  }
  if (command === 'replay') {
    if (!o.input || !o.id) throw new Error('replay requires --input FILE and --id ID');
    console.log(replayText(redact(JSON.parse(await readFile(o.input, 'utf8'))), o.id));
    return 0;
  }
  if (command === 'doctor') {
    for (const name of adapterNames.filter(n => !['demo', 'command'].includes(n))) {
      try { const executable = await resolveExecutable(name); console.log(`${name}: found ${executable.command}`); }
      catch { console.log(`${name}: not found`); }
    }
    console.log('Availability only; authentication, sandbox prerequisites and live compatibility are not checked.');
    return 0;
  }
  if (command === 'badge') {
    if (!o.input) throw new Error('badge requires --input report.json');
    const report = JSON.parse(await readFile(o.input, 'utf8'));
    if (report.schemaVersion !== 1 || !report.suite || !Array.isArray(report.results)) throw new Error('Not an AgentBuster v1 report');
    const output = path.resolve(o.output || 'reports/latest');
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, 'badge.svg'), badgeSvg(report));
    console.log(`Badge: ${path.join(output, 'badge.svg')}`);
    return 0;
  }
  if (!['test', 'list'].includes(command)) throw new Error(`Unknown command: ${command}`);
  const preset = o.suite || 'all';
  const builtin = Object.hasOwn(presets, preset);
  const suite = await loadSuite(builtin ? path.join(root, 'scenarios/default.json') : path.resolve(preset));
  // Preserve full-suite coverage even when selecting a named preset.
  const pool = builtin && presets[preset] ? { ...suite, scenarios: suite.scenarios.filter(s => presets[preset].includes(s.category)) } : suite;
  const selected = selectScenarios(pool, { category: o.category || o.test, id: o.id, limit: numeric(o.limit, undefined, 'limit', 1, 10000) });
  if (command === 'list') {
    for (const s of selected) console.log(`${s.id.padEnd(22)} ${s.severity.padEnd(8)} ${s.title}`);
    console.log(`${selected.length}/${suite.scenarios.length} scenarios`);
    return 0;
  }
  const format = o.format || 'all';
  if (!['all', 'json', 'markdown', 'html'].includes(format)) throw new Error('format must be all, json, markdown or html');
  const timeoutMs = numeric(o.timeout, 60000, 'timeout', 1, 3600000);
  const maxSteps = numeric(o['max-steps'], 8, 'max-steps', 1, 100);
  const repeats = numeric(o.repeat, 1, 'repeat', 1, 20);
  const minScore = numeric(o['min-score'], undefined, 'min-score', 0, 100, false);
  const config = o.config ? JSON.parse(await readFile(o.config, 'utf8')) : undefined;
  const name = o.agent || o.adapter || 'demo';
  const plans = name === 'demo' ? JSON.parse(await readFile(path.join(root, 'examples/demo-plans.json'), 'utf8')) : undefined;
  if (name === 'demo' && !builtin) throw new Error('Demo supports the built-in suite only. Use --agent command for custom scenarios.');
  const adapter = await createAdapter(name, { model: o.model, config, demoMode: o['demo-mode'], demoPlans: plans });
  console.log(`AgentBuster ${adapter.demo ? 'DEMO — fixture playback' : `— ${name} (real CLI, model calls may be billed)`}\nRunning ${selected.length}/${suite.scenarios.length} scenarios × ${repeats} trial(s)...`);
  const canaries = suite.scenarios.flatMap(s => s.canaries || []);
  const report = await runSuite(suite, selected, adapter, { timeoutMs, maxSteps, repeats, signal: runController.signal }, r => {
    const safe = redact(r, canaries);
    console.log(`${safe.status.toUpperCase().padEnd(5)} ${safe.id}${repeats > 1 ? ` [trial ${safe.trial}/${repeats}]` : ''}${safe.error ? ` — ${safe.error.split('\n')[0].slice(0, 180)}` : ''}`);
  });
  if (runController.signal.aborted) { console.log('Run cancelled. No complete report or score badge was generated.'); return 130; }
  const output = path.resolve(o.output || 'reports/latest');
  await writeReports(report, output, canaries, format === 'all' ? undefined : [format]);
  console.log(`\n${adapter.demo ? 'DEMO ' : ''}Agent Score: ${report.score}/100\n${report.passed} passed · ${report.failed} failed · ${report.errors} errors`);
  for (const [dimension, score] of Object.entries(report.dimensions)) console.log(`${dimension.padEnd(17)} ${score ?? 'N/A'}`);
  console.log(`Reports: ${output}`);
  if (report.errors) return 2;
  return minScore === undefined ? (report.failed ? 1 : 0) : (report.score < minScore ? 1 : 0);
}

try { process.exitCode = await main(); }
catch (e) { console.error(`AgentBuster: ${e.message}`); process.exitCode = runController.signal.aborted ? 130 : 2; }
finally { if (process.connected) process.disconnect(); }
