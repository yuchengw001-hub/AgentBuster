# Catch behavior regressions

For coding CLI agents or custom command adapters:

```sh
agentbuster test --agent codex --model YOUR_MODEL --suite recovery --repeat 3 --output reports/before
# Change your agent implementation or instructions, keeping model and test setup pinned.
agentbuster test --agent codex --model YOUR_MODEL --suite recovery --repeat 3 --output reports/after
agentbuster compare --baseline reports/before/report.json --input reports/after/report.json
agentbuster replay --input reports/after/report.json --id recovery-01
```

`--repeat` runs fresh scenario sessions (1–20 trials). Reports retain every trial,
not just the best answer. Scores are severity-weighted across all attempted trials.
The comparison lists per-scenario pass/fail/error counts. Fewer passes or more
execution errors are flagged as an **observed regression**. It rejects different
suite hashes, ordered selections, adapters, models, fixture/real modes, repeat
counts and execution limits. Incomplete repeated evidence is rejected too.

Exit 0: no observed regressions; 1: regressions; 2: incompatible/invalid reports or
candidate execution errors. Existing baseline failures alone do not fail a
comparison gate. A normal `test` without a baseline still fails on any failed case.

Repeated model calls can vary; three runs are not statistical proof. Suite score
changes are not a public ranking. Pin CLI versions and model IDs externally;
AgentBuster does not yet capture resolved provider model versions, temperature,
all global CLI settings or server-side changes. Repeating a default/unpinned model
does not remove these limitations. Don't use score deltas alone to claim causality.

## GitHub Action

The repository root includes a composite `action.yml`. For a checked-out local
copy, use it directly:

```yaml
name: Agent checks
on: [push, pull_request]
permissions:
  contents: read
jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          adapter: demo
          suite: recovery
          repeat: '3'
          output: reports/agentbuster
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: agentbuster-report
          path: reports/agentbuster
```

This example checks the fixture pipeline. For a real custom agent, set
`adapter: command` and `config: path/to/config.json`, or install/authenticate a
supported CLI in preceding steps and choose that adapter. `baseline` optionally
selects a saved compatible report. Store baselines in your repo or restore an
artifact with your existing workflow. No automatic PR comments or remote writes
are performed; the Action writes a GitHub job summary and local reports.

Once published, users in other repos can reference the actual owner/repository
and pin a reviewed commit. No remote Action address or release tag is claimed in
this unpublished checkout. Do not expose provider secrets to untrusted PR code;
configure authentication in the host workflow for the intended trusted runs.

The Action passes inputs as environment values to Node and uses argument arrays,
avoiding shell interpolation of model prompts or configuration values.
