# From GitHub download to your first test

## Requirements

- Node.js **22+** (`node --version`). No runtime dependencies or API key is needed
  for the offline demo and MCP case study.
- For live model runs, separately install and sign in to Claude Code, Codex,
  Gemini CLI or OpenCode. Model calls may be billed by your existing provider.

## Downloaded source / clone

Clone the repository (or download and extract its source ZIP):

```sh
git clone https://github.com/yuchengw001-hub/AgentBuster.git
cd AgentBuster
```

Open a terminal in the AgentBuster directory:

```sh
npm start
```

On Windows, you can also double-click `Start-AgentBuster.cmd`. Open the local URL
printed in the terminal, normally `http://127.0.0.1:4317`. Keep the terminal open.

No dependency installation is required to run from source. To add the CLI command:

```sh
npm install -g .
agentbuster ui
```

For a downloaded npm tarball from a maintainer release:

```sh
npm install -g ./agentbuster-0.1.1.tgz
agentbuster ui
```

The npm registry package is not published by this GitHub release. Use the source
or the reviewed tarball from [AgentBuster releases](https://github.com/yuchengw001-hub/AgentBuster/releases).

## First click

1. Leave **Target → MCP failure → fix · no account** selected.
2. Click **Start test**. Logs and status update while real MCP subprocesses run.
3. Verify two reproduced failures and two passing fixes. Click **Before fix** and
   **After fix** in the report area to inspect their evidence.
4. Download JSON, Markdown or a DEMO badge. This engineered example evaluates
   deterministic sample clients; it does not evaluate an LLM.

The main console and reports support English (first-use default), Chinese,
Japanese and Spanish from the upper-right language control. Manual preferences
are remembered when storage is available; raw agent/tool evidence remains intact.

## Your own coding CLI

1. Select your installed CLI in **Target**.
2. Check the **Environment** panel. Missing CLIs cannot start; the help links lead
   to official installation and sign-in instructions. **Found** means the command
   exists, not that authentication has been validated.
3. Start with **1 scenario**. Optionally set your model under advanced settings.
4. Confirm use of your CLI/login and possible charges, then click **Start test**.
5. Inspect the current run's report. Startup/login/configuration failures appear
   as errors, not passing scores. **Stop test** cancels the worker and prevents
   subsequent decisions; requests already received by a provider may still bill.

The tests measure behavior with simulated tools. For fault injection in your own
real MCP connection, follow [MCP.md](MCP.md), including `agentbuster init`.

## Regression check

Select a completed run as baseline in advanced settings before starting another
run. Keep suite, selected case count, model, adapter, trial count and budgets the
same. The console links the comparison when available. It explains incompatible
baselines without pretending that their scores are comparable. Observed changes
are not a statistical guarantee of model improvement or regression.

## Where data lives

Each console run is saved under `reports/ui/<run-id>` relative to the directory
where you launched the console. Restarting the console restores up to 100 local
history entries and displays the most recent 50. Incomplete runs are marked
interrupted after restart. These local records are ignored by this repository's
Git rules; review any report before publishing it.

All commands continue to work without a browser. `agentbuster --help` lists the
full command interface. `agentbuster test` defaults to a fixture-only DEMO.

## Troubleshooting

- **Port already in use:** stop an older console, or run `agentbuster ui --port 4318`.
- **Cannot reach console:** keep its terminal running and reload the printed URL.
- **CLI found but run fails:** check the raw error and your CLI's login/settings;
  try that CLI in your own terminal. The GUI does not configure home directories,
  sandbox backends, provider access or account credentials.
- **Gemini sandbox unavailable:** configure a supported sandbox backend using its
  official CLI documentation before rerunning.
- **Downloaded package moved:** run `agentbuster init` again in a new output
  directory if you previously generated MCP snippets with absolute installation paths.

This release candidate has local Windows validation. Hosted OS-matrix CI and
live-provider compatibility checks must be completed before claiming broad
provider support. See [VALIDATION.md](VALIDATION.md) for evidence and limitations.
