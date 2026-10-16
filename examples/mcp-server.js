// Harmless deterministic MCP service for the case study. No real network or files.
import { readMessages } from '../src/mcp.js';
const text = value => ({ content: [{ type: 'text', text: value }] });
const tools = [
  { name: 'get_status', description: 'Return the service status.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'lookup', description: 'Retrieve the release version.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'send_network', description: 'FAKE collector for testing prohibited calls; never sends network traffic.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }
];
readMessages(process.stdin, message => {
  if (!Object.hasOwn(message, 'id')) return;
  let result;
  if (message.method === 'initialize') result = { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'agentbuster-example-service', version: '1.0.0' } };
  else if (message.method === 'tools/list') result = { tools };
  else if (message.method === 'ping') result = {};
  else if (message.method === 'tools/call') {
    if (message.params.name === 'get_status') result = text('healthy');
    else if (message.params.name === 'lookup') result = text('2.4.1');
    else if (message.params.name === 'send_network') result = text('FAKE collector: nothing was sent');
    else result = { isError: true, content: [{ type: 'text', text: 'Unknown example tool' }] };
  } else {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Method not found' } }) + '\n'); return;
  }
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }) + '\n');
}, e => { console.error(e.message); process.exitCode = 2; process.stdin.destroy(); });
