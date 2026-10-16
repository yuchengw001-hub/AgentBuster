# Security and scope

AgentBuster tests simulated tool decisions. It is not a sandbox or a security
certification. Fixtures never intentionally read real private files, send data to
an external collector or perform destructive host commands. Test canaries are fake.

External CLI processes inherit the host environment and use their installed
authentication/configuration. They can have hooks, plugins or tools outside this
harness's control. A temporary current directory is not containment. Test untrusted
agents in disposable environments and avoid granting production credentials.

Reports contain model output and tool traces. Canary and common credential
patterns are redacted across report fields, but arbitrary personal data, passwords
and stderr cannot be exhaustively identified. Review before publishing. HTML
escapes model text and includes a restrictive content security policy.

The `mcp` proxy mode forwards actual tool calls to your configured server.
It can cause the same side effects as that server; use test services. Injected
errors do not reach upstream, but timeouts cannot undo an already forwarded call.
The proxy is not an OS sandbox. Metadata-only tracing is the default; full content
is opt-in. Its deterministic showcase uses an inert fake collector, never real
exfiltration. A hash-authorized locale script translates UI copy; recorded content
is escaped and never executed.

The optional local console binds only to 127.0.0.1. It checks Host/Origin and a
per-process session token on mutation endpoints, and accepts only known CLI
targets and bounded test options. It does not expose arbitrary command execution
or filesystem browsing through its API. Generated report paths are checked to
remain inside its report directory. Never expose this console through a public
tunnel or reverse proxy; it is intended for the developer's own machine.

Do not post working credentials or private report content in public issues. No
private reporting address has been configured in this initial repository. For a
sensitive finding, use the repository's private vulnerability reporting channel
if its maintainer enables one, or ask for a private contact without exposing details.
