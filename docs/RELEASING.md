# Maintainer release checklist

The product is distributed source/CLI plus an optional local browser console.
It must run on the user's own machine without the author's workspace or server.

Before the first public version:

1. Run `npm test` and the GitHub OS matrix. Inspect the actual results; a workflow
   file alone is not evidence that its hosted jobs passed.
2. Run `npm pack --dry-run`, inspect the file list for credentials, local reports,
   logs or absolute workspace paths. Source assets must include `ui/`, scenarios,
   examples and licenses. Absolute paths belong only in generated local snippets.
3. Install the tarball in a separate prefix/directory. Start `agentbuster ui` there,
   click the MCP example, inspect its report and verify stop/history/downloads.
4. Test at least one scenario with each claimed provider using real installed
   versions and an authenticated account. Record OS, CLI/model versions and date.
   Keep unsupported/unverified integrations explicitly labeled experimental.
5. Ask external developers to follow QUICKSTART from a clean source download.
   Verify that their first click and first real-agent run work without help.
6. Choose the actual GitHub repository and check npm name ownership. Fill in real
   repository/issue URLs in package metadata once known, enable private security
   reporting, and review SECURITY.md. Public repository: yuchengw001-hub/AgentBuster.
7. Review the release notes: demo vs live scope, supported transports, pricing
   responsibility, known limitations, and install instructions. Never promote a
   fixture score as a live model result.

`.github/workflows/package.yml` builds and uploads an npm tarball on a manual run
or a `v*` tag after tests. It does not publish npm or create a GitHub release.
The maintainer can attach the reviewed artifact to a release, then publish to npm
after name ownership and credentials are configured. Publishing is a separate action.

Windows users can launch source with Start-AgentBuster.cmd; other platforms use
`npm start` or installed `agentbuster ui`. The Node.js dependency is explicit.
The project does not ship a standalone native executable or hosted web service.
