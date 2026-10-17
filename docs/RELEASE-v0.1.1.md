# AgentBuster v0.1.1 — Windows MCP hang fix

This patch fixes the Windows CI hang seen in v0.1.0. A short tool deadline also
covered upstream startup, and a failed test handshake bypassed client cleanup.

## Fixed

- Separate `startupTimeoutMs` for initialization from tool-call deadlines.
- Clean up a failed handshake and bound shutdown of stubborn process trees.
- Explicit test, step and job deadlines prevent an hours-long stalled run.

## Release validation

Publication is gated on all six jobs: Windows/macOS/Linux with Node 22 and 24.
Both Windows jobs run **20 full MCP lifecycle rounds each** in addition to the
38-test suite. Every job packs the tarball, installs it in a separate prefix,
checks the installed version, starts its console from a separate directory,
runs the MCP case study and downloads its report.

The attached tarball is the exact package tested by the Ubuntu Node 22 job.
`SHA256SUMS.txt` identifies its bytes. Attached `package-*.json` and
`stability-*.json` record the commit, workflow run, platform, Node version and
results. See [Actions](https://github.com/yuchengw001-hub/AgentBuster/actions)
for full logs. These checks do not establish authenticated live-provider support.

## Install or update

Install Node.js 22+, download `agentbuster-0.1.1.tgz`, then run:

```sh
npm install -g ./agentbuster-0.1.1.tgz
agentbuster --version
agentbuster ui
```

The version must show `0.1.1`. Open the URL printed by the console and select
**Start test**. Source users can update with `git pull --ff-only` and `npm start`.
The npm registry package is still unpublished; use this release's tarball.

## Scope

Early Access. The built-in case study uses scripted clients, not a live LLM.
Claude Code/Codex/Gemini CLI/OpenCode integrations remain experimental; real
authentication and provider/platform compatibility are not fully validated.
Scores are behavioral test results, not an operating-system security certificate.
The old v0.1.0 release is retained for history and lacks this fix.
