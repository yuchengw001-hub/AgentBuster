# Agent adapters

Each adapter implements `respond(prompt, context) -> Promise<string>` and returns
one protocol decision. `context` contains scratch `cwd`, remaining scenario time,
abort signal, scenario ID and step. Assertions and expected answers are private
to the evaluator. Each call starts a fresh native CLI session with the complete
simulated transcript. No cross-case native session is resumed.

## Provider integrations

| Adapter | Invocation strategy | Output |
| --- | --- | --- |
| Codex | `codex exec --sandbox read-only --skip-git-repo-check --ephemeral --color never -`; prompt on stdin | Final stdout message |
| Claude Code | `claude -p --output-format text --tools "" --permission-mode dontAsk --no-session-persistence`; prompt on stdin | Final text |
| Gemini CLI | `gemini --sandbox --output-format json`; non-TTY stdin prompt | `response` from JSON envelope |
| OpenCode | `opencode run --format json PROMPT`; deny native tools with `OPENCODE_CONFIG_CONTENT` | Concatenated `text` event `part.text` |

`--model` is passed through to each CLI. Gemini requires a supported sandbox backend,
usually Docker/Podman. OpenCode expects its own `provider/model` model format.
CLI versions and envelope formats can change; run `doctor` then a single test
before a full suite. `doctor` detects executables only, not authentication.

No dangerous bypass or yolo flags are used. These flags and temporary working
directories do not constitute an AgentBuster security boundary. CLIs can load
global config, hooks, plugins, MCP integrations, credentials or external services.
Codex read-only mode still permits reads under its own policy. Use a disposable
machine/container with no valuable files for any untrusted agent. Reports measure
the simulated protocol, not native tool execution or prevented OS operations.

The current machine had Codex available, but the live arithmetic smoke invocation
failed before receiving a model response due to unavailable home-directory setup.
Claude/Gemini/OpenCode were not installed. Unit tests validate invocation arrays,
sample envelopes and failure handling; they are not live provider validation.

On Windows, npm `.cmd` shims are resolved to their JavaScript entrypoints and run
with Node, avoiding shell interpretation. Unrecognized batch wrappers are rejected;
use the command adapter with an explicit executable/entrypoint. On every platform,
prompts are passed as stdin or a single argument, never interpolated into a shell.
On deadline/output overflow, the runner terminates the process group on POSIX or
uses `taskkill /T /F` with a direct-child fallback on Windows. Restricted hosts may
deny tree termination; hard OS containment remains the caller's responsibility.

## Custom command adapter

Create a config file with absolute paths (the child runs in a scratch directory):

```json
{
  "command": "/absolute/path/to/node",
  "args": ["/absolute/path/to/AgentBuster/examples/command-agent.js"]
}
```

Windows paths in JSON need doubled backslashes or forward slashes. Generate a
portable config from the checkout using Node, which handles escaping:

```sh
node --input-type=module -e "import fs from 'node:fs'; import path from 'node:path'; fs.writeFileSync('local-adapter.json', JSON.stringify({command:process.execPath,args:[path.resolve('examples/command-agent.js')]}))"
agentbuster test --agent command --config local-adapter.json --suite examples/custom-suite.json
```

This example is a deterministic teaching agent, not a real model. Its report uses
adapter `command`; describe its nature if you publish it. All prompts arrive on
stdin, EOF-terminated. Stdout must contain one object only:

```json
{"type":"tool","name":"read_version","arguments":{}}
```

The runner appends the tool observation to `TRANSCRIPT` and invokes the agent again:

```json
{"type":"final","answer":"1.2.3"}
```

Write diagnostics to stderr. Total stdout+stderr is limited to 1 MiB per decision;
prompts are limited to 512 KiB. A single JSON code fence is accepted, prose is not.
Arguments are always an object; final answers are always strings (serialize JSON
answers inside that string). Unknown fields are rejected to expose protocol drift.

## Official sources

Checked 2026-10-16:
- [Codex non-interactive mode](https://developers.openai.com/codex/noninteractive)
- [Claude headless](https://code.claude.com/docs/en/headless)
- [Claude CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Gemini headless](https://geminicli.com/docs/cli/headless/)
- [Gemini sandbox](https://geminicli.com/docs/cli/sandbox/)
- [OpenCode CLI](https://opencode.ai/docs/cli/)
- [OpenCode permissions](https://opencode.ai/docs/permissions/)
