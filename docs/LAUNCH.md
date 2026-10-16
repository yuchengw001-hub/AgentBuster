# First public release: acceptance contract

Both audiences share one core: observable failures and reproducible regressions.

The distributable local console (`agentbuster ui` / `npm start`) is a first-class
entrypoint: target selection, executable checks, explicit live usage confirmation,
start/stop, progress, isolated run artifacts, history and baseline selection.
The static HTML report alone is not the launch experience. Every distributed
package must contain the UI and work from a consumer's own working directory.

1. Coding-agent users run the existing behavioral suite against an installed CLI,
   repeat cases, inspect the failed trace, and compare candidate vs baseline.
2. Custom-agent/MCP users wrap a real stdio MCP server, inject deterministic tool
   errors/latency/untrusted text, and record what crossed the tool boundary.
3. A no-account walkthrough executes actual MCP subprocess traffic with two tiny
   explicitly deterministic example clients: one mishandles errors, one retries.
   This is a real transport integration example, never a real LLM quality claim.

Ship a useful command surface:

```
agentbuster mcp --config fault-config.json
agentbuster test --agent codex --repeat 3 --limit 5
agentbuster compare --baseline before/report.json --input after/report.json
agentbuster replay --input after/report.json --id recovery-01
agentbuster showcase --output reports/showcase
```

Comparison must reject incompatible suites, selections, models, execution modes,
repeat counts and limits. Changes in pass/fail/error counts are observations,
not statistical significance. MCP traces cannot provide an Agent Score: the proxy
observes tools, not the agent's final task outcome. Error executions never pass CI.

Keep zero runtime dependencies, bounded streams/time, no untrusted shell strings,
explicit fake injection data, and a clear distinction between fixtures, real MCP
traffic and live LLM evaluation. No OS containment or remote HTTP proxy claims.

Release gates: offline walkthrough works from the package; transparent initialize,
notifications, tools/list and tools/call; deterministic faults; bounded upstream
failure and cleanup; actionable comparisons and offline trace replay; regression
tests and Windows/Linux CI; clear install docs for both audiences.

Live CLI authentication remains an external prerequisite. Do not describe the
release as fully validated for a provider until a real invocation succeeds. This
contract raises the intended first public release quality; it does not promise stars.

Wire references: MCP 2025-06-18 stdio framing and CallToolResult.isError, checked
2026-10-16 at https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
and https://modelcontextprotocol.io/specification/2025-06-18/server/tools.
