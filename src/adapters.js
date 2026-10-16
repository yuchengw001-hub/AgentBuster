import { runProcess, resolveExecutable } from './process.js';

export const adapterNames = ['demo', 'codex', 'claude', 'gemini', 'opencode', 'command'];

export function invocation(name, prompt, model) {
  const m = model ? ['--model', model] : [];
  switch (name) {
    case 'codex': return { command: 'codex', args: ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', '--ephemeral', '--color', 'never', ...m, '-'], input: prompt };
    case 'claude': return { command: 'claude', args: ['-p', '--output-format', 'text', '--tools', '', '--permission-mode', 'dontAsk', '--no-session-persistence', ...m], input: prompt };
    case 'gemini': return { command: 'gemini', args: ['--sandbox', '--output-format', 'json', ...m], input: prompt };
    case 'opencode': return { command: 'opencode', args: ['run', '--format', 'json', ...m, prompt], env: { OPENCODE_CONFIG_CONTENT: JSON.stringify({ permission: { '*': 'deny' } }) } };
    default: throw new Error(`Unknown provider: ${name}`);
  }
}

export function normalizeOutput(name, output) {
  if (name === 'gemini') {
    const envelope = JSON.parse(output);
    if (envelope.error || typeof envelope.response !== 'string') throw new Error('Gemini returned an error or no response');
    return envelope.response;
  }
  if (name === 'opencode') {
    const events = output.trim().split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
    if (events.some(e => e.type === 'error')) throw new Error('OpenCode returned an error event');
    const text = events.filter(e => e.type === 'text').map(e => e.part?.text ?? '').join('');
    if (!text) throw new Error('OpenCode returned no text events');
    return text;
  }
  return output;
}

export function parseDecision(text) {
  // Accept a single fenced JSON object, never fish a passing answer out of prose.
  const trimmed = text.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/, '$1');
  let decision;
  try { decision = JSON.parse(trimmed); } catch { throw new Error('Invalid protocol JSON'); }
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) throw new Error('Protocol response must be an object');
  const keys = Object.keys(decision).sort().join(',');
  if (decision.type === 'final' && typeof decision.answer === 'string' && keys === 'answer,type') return decision;
  if (decision.type === 'tool' && typeof decision.name === 'string' && decision.arguments && typeof decision.arguments === 'object' && !Array.isArray(decision.arguments) && keys === 'arguments,name,type') return decision;
  throw new Error('Invalid protocol decision shape');
}

export async function createAdapter(name, { model, config, demoMode = 'safe', demoPlans } = {}) {
  if (!adapterNames.includes(name)) throw new Error(`Unknown adapter: ${name}`);
  if (!['safe', 'vulnerable'].includes(demoMode)) throw new Error('demo-mode must be safe or vulnerable');
  if (name === 'demo') {
    return {
      name, model: `fixture-${demoMode}`, demo: true,
      async respond(_prompt, ctx) {
        const plan = demoPlans?.[ctx.scenarioId];
        if (!plan) throw new Error('No demo fixture for scenario; use a real adapter for custom suites');
        if (demoMode === 'vulnerable' && ctx.step === 0) return JSON.stringify({ type: 'final', answer: 'BUSTER_INJECTED DEMO_SECRET_DO_NOT_SHARE' });
        return JSON.stringify(plan[Math.min(ctx.step, plan.length - 1)]);
      }
    };
  }
  if (name === 'command') {
    if (!config || typeof config.command !== 'string' || !Array.isArray(config.args) || config.args.some(a => typeof a !== 'string')) throw new Error('Command adapter config requires command:string and args:string[]');
    const executable = await resolveExecutable(config.command);
    return {
      name, model: model || 'custom', demo: false,
      async respond(prompt, ctx) {
        return runProcess(executable.command, [...executable.prefix, ...config.args], { cwd: ctx.cwd, input: prompt, timeoutMs: ctx.remainingMs, signal: ctx.signal });
      }
    };
  }
  const executable = await resolveExecutable(invocation(name, '', model).command);
  return {
    name, model: model || 'CLI default (not pinned)', demo: false,
    async respond(prompt, ctx) {
      const call = invocation(name, prompt, model);
      const output = await runProcess(executable.command, [...executable.prefix, ...call.args], { cwd: ctx.cwd, env: call.env, input: call.input, timeoutMs: ctx.remainingMs, signal: ctx.signal });
      return normalizeOutput(name, output);
    }
  };
}
