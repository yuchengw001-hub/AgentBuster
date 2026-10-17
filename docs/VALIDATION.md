# Validation

## Windows hang investigation — 2026-10-17

CI run [38885066656](https://github.com/yuchengw001-hub/AgentBuster/actions/runs/38885066656)
passed Linux/macOS but both Windows Node 22/24 jobs failed the delayed MCP case,
then remained alive until cancellation about six hours later. The 100ms request
budget also applied to server initialization. The test helper threw before
returning the client, bypassing the caller's cleanup block and leaving a process.
One prior green run does not establish Windows stability.

The source correction separates initialization and tool deadlines, cleans up a
failed test handshake, bounds client shutdown and terminates stubborn process
trees. Regression checks cover slow startup, a failed handshake whose process
must be gone, and a process tree holding inherited pipes open. Windows CI repeats
the lifecycle suite twice after the full suite in the initial correction. Individual tests and CI steps/jobs
have explicit limits. Consult Actions for hosted results for the corrected commit;
the v0.1.0 release tag does not contain this correction.

For v0.1.1, CI requires 20 lifecycle rounds on Windows Node 22 and 24 and an
actual pack/install/console/MCP check on all six OS/Node combinations. Release
publication depends on all jobs succeeding. Validation records identify the exact
commit/run and package SHA-256; they are attached alongside the tested tarball.
This covers the offline suite and package lifecycle, not all live-agent testing.

## Original MVP local validation — 2026-10-16

Local environment: Windows, Node.js 24.20.0, npm 11.19.0.

Completed checks:

- 35 native Node test cases pass, including 50 safe fixtures, 50 intentionally
  vulnerable fixtures, execution traces, recovery, step limits, provider envelope
  parsing, custom subprocess round trips, deadlines, output caps, redaction,
  report escaping, CLI aliases/filters/exit gates and report/badge generation.
- Real MCP subprocess integration: initialization, discovery, concurrent calls,
  errors, deterministic faults, delayed requests, malformed upstream, trace privacy.
- Case study: broken scripted client fails 2 cases; fixed client passes both;
  compatible comparisons and offline trace replay verified, regression gate exits 1.
- Repeated trials retain counts and trial numbers; incompatible and incomplete
  reports are rejected. Setup snippets and local Action driver tested.
- Four-language UI verified in English, Chinese, Japanese and Spanish, including
  immediate switching, remembered choice, inaccessible storage fallback, and CSP
  hash. Browser preview restored to English.
- Interactive loopback console: start, progress, report/download routing, saved
  run records, compatible/incompatible baseline handling, cancellation, provider
  billing acknowledgement and missing-CLI states. Requests with foreign origins,
  missing session tokens, arbitrary commands or invalid options are rejected.
- Managed cancellation sends an IPC cancellation to the CLI worker before forced
  termination, allowing it to cancel its current adapter and skip later scenarios.
- Simultaneous console launch requests reserve a single worker before asynchronous
  setup, preventing concurrent runs from separate browser requests.
- Windows npm shims resolve through Node even with adjacent extensionless scripts.
- Installed npm tarball check from a separate working directory: CLI console
  starts, serves UI assets, runs the real MCP case study, and returns its correct
  downloadable report. `scripts/package-smoke.js` makes this repeatable.
- Browser verification: clicking Start test reaches COMPLETED; Before fix shows
  2 findings, After fix shows 0; main/report language switching stays coordinated;
  missing CLI and unchecked usage confirmation prevent a live launch. Restarting
  the console restores its saved history. Preview remains in English.
- Offline full demo: 50 passed, score 100, visibly marked DEMO.
- Vulnerable demo: 50 failed, score 0, 15 critical findings, visibly marked DEMO.
- Custom command example: subprocess reads stdin, calls simulated tool, receives
  observation on the next turn and returns a verified answer.
- `npm pack` succeeds with a workspace-local cache; resulting tarball installs
  under a temporary workspace prefix and the installed entrypoint runs the demo.
- HTML report rendered in the in-app browser: score, six dimensions, coverage,
  demo notice and evidence disclosure rows visually inspected.
- Codex executable detected. A live single-case arithmetic smoke run exits with
  an adapter error before a model response: home-directory setup unavailable.
- Claude Code, Gemini CLI and OpenCode executables absent. No live provider
  compatibility or model quality result is claimed.

CI configuration covers Node 22/24 on Windows/Linux/macOS. Hosted workflow
results are separate from the local checks above; consult the repository Actions
page for their current status. npm registry publication is a separate operation.

Reports are generated under ignored `reports/`. Scores are deterministic fixture
results only unless the report identifies a real adapter. See DESIGN.md for the
simulated behavioral scope and ADAPTERS.md for execution limitations.
