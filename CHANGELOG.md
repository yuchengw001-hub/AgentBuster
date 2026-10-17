# Changelog

## Unreleased

- Separate MCP initialization/startup deadlines from short tool-call deadlines.
- Clean up the test client on a failed initialization; bound client shutdown and
  terminate stubborn process trees on Windows and POSIX hosts.
- Add slow-start, failed-handshake cleanup and inherited-pipe regression tests.
- Bound individual tests to 30 seconds and CI jobs to 10 minutes; repeat MCP
  lifecycle checks on both Windows Node versions without cancelling other jobs.

The v0.1.0 tag predates these fixes. Use the current source for this correction.

## 0.1.0 — 2026-10-16 · Early Access

First public preview of AgentBuster, a local security and reliability testing tool
for tool-using AI agents.

- Interactive local console: agent selection, executable checks, start/stop,
  progress, isolated reports, history and compatible baseline comparisons.
- CLI with 50 behavioral scenarios, repeated trials, transparent severity-weighted
  grading, JSON/Markdown/HTML reports and locally generated SVG badges.
- Real stdio MCP fault proxy for deterministic tool errors, pre-call latency and
  untrusted text injection. Metadata-only tracing by default.
- Reproducible failure-and-fix case study using scripted clients over real MCP
  traffic. No account or LLM is required for this example.
- Initial experimental adapters for Claude Code, Codex, Gemini CLI and OpenCode;
  command adapter for custom agents, and generated native MCP setup snippets.
- English, Chinese, Japanese and Spanish interfaces; English first-use default.
- Offline CI, a composite regression Action and release-package validation.
- MIT license, contribution guide, quickstart and security/scope documentation.

### Known limitations

- Live provider compatibility has not been established for every CLI/platform.
  Installation, authentication and sandbox backends remain user prerequisites.
- Behavioral suite tools are simulated. MCP proxy traffic is real, but the proxy
  alone does not grade task success or certify OS security.
- DEMO scores describe fixtures/scripted clients, never real model quality.
- Repeat comparisons flag observed differences, not statistical significance.
- stdio only; no Streamable HTTP proxy. Requires Node.js 22+, no native executable.
- npm registry publication is separate. Use this repository or a reviewed tarball.
