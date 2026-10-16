# AgentBuster v0.1.0 — Early Access

**Break your AI Agent before your users do.**

AgentBuster is an MIT-licensed local testing tool for AI-agent developers. Use it
to exercise tool-use decisions, inject controlled failures into MCP connections,
inspect evidence and catch behavior changes before shipping.

## Start in under a minute

Install Node.js 22+, then:

```sh
git clone https://github.com/yuchengw001-hub/AgentBuster.git
cd AgentBuster
npm start
```

Open the local URL printed in the terminal and click **Start test**. The default
MCP case study needs no account and verifies two engineered failures and fixes.
Its clients are scripted; it is not a live-model benchmark.

For an attached npm tarball:

```sh
npm install -g ./agentbuster-0.1.0.tgz
agentbuster ui
```

This package is not a claim of npm registry publication. Source ZIP downloads can
run directly with `npm start` too. Windows users may use `Start-AgentBuster.cmd`.

## Included

- Browser console with start/stop, live progress, history and current-run reports.
- 50 behavioral cases with transparent scoring, repeats and evidence replay.
- Real stdio MCP fault injection: tool errors, delay and untrusted result text.
- Compatible before/after comparisons and a composite GitHub Action.
- JSON, Markdown, HTML and SVG badges; four UI languages, English default.
- Custom command adapter plus four experimental coding-CLI integrations.

## What to know before using live agents

Install/authenticate the selected CLI separately. Start with one case; provider
calls may incur charges. The four live CLI adapters are experimental and not all
have authenticated end-to-end validation. A detected executable is not a validated
login. The behavioral suite uses simulated tools; the MCP proxy uses real traffic.
No score is an OS-security certificate or calibrated public ranking.

Local validation includes the automated test suite, an isolated tarball install,
console launch from a separate working directory, MCP cases and report downloads.
See [validation](https://github.com/yuchengw001-hub/AgentBuster/blob/main/docs/VALIDATION.md)
and the repository's Actions page for current hosted CI results.

## Useful links

- [Quickstart](https://github.com/yuchengw001-hub/AgentBuster/blob/main/docs/QUICKSTART.md)
- [MCP setup](https://github.com/yuchengw001-hub/AgentBuster/blob/main/docs/MCP.md)
- [Regression/CI guide](https://github.com/yuchengw001-hub/AgentBuster/blob/main/docs/REGRESSIONS.md)
- [Report a bug](https://github.com/yuchengw001-hub/AgentBuster/issues/new/choose)

Feedback on installation, real CLI compatibility and small reproducible failure
cases is especially welcome. Review and redact reports before posting them.
