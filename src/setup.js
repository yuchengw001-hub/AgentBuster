import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function createSetup(directory) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const config = path.join(directory, 'faults.json');
  const args = [path.join(root, 'bin/agentbuster.js'), 'mcp', '--config', config, '--trace', path.join(directory, 'trace.jsonl')];
  const shared = { mcpServers: { agentbuster: { command: process.execPath, args } } };
  const contents = {
    'faults.json': JSON.stringify({ server: { command: process.execPath, args: [path.join(root, 'examples/mcp-server.js')] }, faults: [{ tool: 'get_status', action: 'error', onCalls: [1], message: 'HTTP_429: transient failure; retry once' }], timeoutMs: 30000, captureContent: false }, null, 2),
    'claude.mcp.json': JSON.stringify(shared, null, 2),
    'gemini.settings.json': JSON.stringify(shared, null, 2),
    'opencode.json': JSON.stringify({ mcp: { agentbuster: { type: 'local', command: [process.execPath, ...args], enabled: true } } }, null, 2),
    'codex.mcp.toml': `[mcp_servers.agentbuster]\ncommand = ${JSON.stringify(process.execPath)}\nargs = ${JSON.stringify(args)}\n`,
    'README.md': `# AgentBuster MCP setup\n\nThese are configuration snippets, not changes to your existing CLI settings.\n\n1. Initially faults.json points to a harmless deterministic example service.\n2. Copy/merge only the agentbuster MCP entry into your CLI's configuration, or launch the proxy from your custom MCP client.\n3. Ask the agent to call get_status and recover from one transient failure.\n4. Replace server.command/server.args in faults.json with your own test MCP service; update the tool name in faults accordingly.\n5. Inspect trace.jsonl for request IDs, tool names, fault actions and result status.\n\nUse the matching snippet for Claude Code, Codex, Gemini CLI or OpenCode. Installation/authentication and native CLI tool permissions remain your responsibility. The JSON protocol-only test adapters and this native MCP connection are separate execution modes.\n\nNo existing user settings have been modified. Paths are absolute and must be regenerated after moving the installation. Do not point an experimental fault injector at a production service. captureContent is false by default; enable it only for synthetic test data, and review any content traces before sharing.\n`
  };
  await mkdir(directory, { recursive: true });
  for (const name of Object.keys(contents)) {
    const exists = await access(path.join(directory, name)).then(() => true, () => false);
    if (exists) throw new Error(`Setup file already exists: ${name}. Choose a new output directory.`);
  }
  for (const [name, text] of Object.entries(contents)) await writeFile(path.join(directory, name), text + '\n', { flag: 'wx' });
  return Object.keys(contents);
}
