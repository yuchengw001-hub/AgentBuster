import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const weights = { low: 1, medium: 2, high: 3, critical: 5 };
const assertionTypes = new Set(['answer_equals', 'answer_excludes', 'answer_json', 'tool_called', 'tool_forbidden', 'max_calls', 'tool_sequence']);
const object = v => v && typeof v === 'object' && !Array.isArray(v);

export function validateSuite(suite) {
  if (!object(suite) || suite.version !== 1 || typeof suite.name !== 'string' || !Array.isArray(suite.scenarios) || !suite.scenarios.length) throw new Error('Suite requires version:1, name, and nonempty scenarios');
  const ids = new Set();
  for (const s of suite.scenarios) {
    if (!object(s) || typeof s.id !== 'string' || !/^[a-z0-9-]+$/.test(s.id) || ids.has(s.id)) throw new Error(`Invalid or duplicate scenario ID: ${s?.id}`);
    ids.add(s.id);
    if (!s.title || typeof s.title !== 'string' || !s.category || typeof s.category !== 'string' || !Object.hasOwn(weights, s.severity) || typeof s.task !== 'string') throw new Error(`Invalid metadata: ${s.id}`);
    if (!object(s.tools) || !Array.isArray(s.assertions) || !s.assertions.length) throw new Error(`Missing tools/assertions: ${s.id}`);
    for (const [name, t] of Object.entries(s.tools)) {
      if (!object(t) || typeof t.description !== 'string' || !Array.isArray(t.responses) || !t.responses.length) throw new Error(`Invalid tool ${name} in ${s.id}`);
      if (t.arguments !== undefined && !object(t.arguments)) throw new Error(`Invalid tool arguments: ${s.id}`);
    }
    if (s.context !== undefined && typeof s.context !== 'string') throw new Error(`Invalid context: ${s.id}`);
    if (s.canaries !== undefined && (!Array.isArray(s.canaries) || s.canaries.some(c => typeof c !== 'string' || c.length < 8))) throw new Error(`Invalid canaries: ${s.id}`);
    for (const a of s.assertions) {
      if (!object(a) || !assertionTypes.has(a.type)) throw new Error(`Unknown assertion in ${s.id}`);
      if (['answer_equals', 'answer_excludes'].includes(a.type) && typeof a.value !== 'string') throw new Error(`Assertion needs string value: ${s.id}`);
      if (a.type === 'answer_json' && !Object.hasOwn(a, 'value')) throw new Error(`Assertion needs JSON value: ${s.id}`);
      if (['tool_called', 'tool_forbidden'].includes(a.type) && (typeof a.name !== 'string' || (a.arguments !== undefined && !object(a.arguments)))) throw new Error(`Assertion needs tool name/arguments: ${s.id}`);
      if (a.type === 'max_calls' && (!Number.isInteger(a.value) || a.value < 0)) throw new Error(`Invalid call limit: ${s.id}`);
      if (a.type === 'tool_sequence' && (!Array.isArray(a.value) || a.value.some(c => !object(c) || typeof c.name !== 'string' || !object(c.arguments)))) throw new Error(`Invalid tool sequence: ${s.id}`);
    }
  }
  return suite;
}

export async function loadSuite(file) {
  const suite = validateSuite(JSON.parse(await readFile(file, 'utf8')));
  return { ...suite, fingerprint: createHash('sha256').update(JSON.stringify(suite)).digest('hex') };
}

export function selectScenarios(suite, { category, id, limit } = {}) {
  let selected = suite.scenarios.filter(s => (!category || s.category === category) && (!id || s.id === id));
  if (limit !== undefined) selected = selected.slice(0, limit);
  if (!selected.length) throw new Error('No matching scenarios');
  return selected;
}
