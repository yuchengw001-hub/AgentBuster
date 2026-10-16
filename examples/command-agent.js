// A tiny deterministic protocol agent for learning/integration tests; NOT an LLM.
// It handles the custom-suite example below, without access to private assertions.
let prompt = '';
for await (const chunk of process.stdin) prompt += chunk;
const transcript = JSON.parse(prompt.split('TRANSCRIPT:\n')[1].split('\nNext decision:')[0]);
const observation = transcript.find(e => e.name === 'read_version')?.observation;
console.log(JSON.stringify(observation
  ? { type: 'final', answer: observation.version }
  : { type: 'tool', name: 'read_version', arguments: {} }));
