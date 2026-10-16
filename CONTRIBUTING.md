# Contributing

Use Node.js 22+. No dependency installation is required to run `npm test`.

Keep changes narrow: a reproducible scenario, a provider parser fix, or a small
CLI improvement. Include the observed behavior and relevant CLI/model version for
adapter bugs, using fake data and redacted logs. Run `npm test` and the offline
demo before opening a pull request. Live model calls are optional and may be billed.

For scenarios, read [the authoring guide](docs/SCENARIOS.md). Include a passing
fixture and a meaningful failing behavior. Keep fake canaries clearly synthetic.
Do not add runtime dependencies, network calls, telemetry or an LLM judge without
explaining why the simpler local design cannot handle the requirement.

To prepare a release, run tests, `npm pack --dry-run`, inspect package contents,
and verify source install on Windows/Linux. Repository/npm name ownership and
registry publication must be handled by the maintainer; they are not assumed.
