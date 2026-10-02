# Progress

Living status file for `@processlink/node-red-contrib-processlink`. Update it at the end of every task.

## Overview

A published npm package of Node-RED nodes that connect flows to the Process Link platform (version 1.9.2 in `package.json`, MIT licence). Real customers run it in production Node-RED, so backwards compatibility of existing node configurations matters.

Stack:

- Plain CommonJS JavaScript (no build step, no TypeScript), each node a `.js` runtime file plus a `.html` editor file.
- Zero production dependencies. HTTP uses the native `https` module.
- Node-RED >= 2.0.0, Node.js >= 18.
- Jest 29 with `node-red-node-test-helper` for tests. Husky pre-push hook (branch guard only).
- Talks to Process Link APIs with centralised `plk_*` API keys (Bearer token) over HTTPS: Files and ProcessMail.

Nodes registered in `package.json`: `processlink-config`, `processlink-files-upload`, `processlink-mail`, `processlink-sms`, `processlink-notify-group`, `processlink-system-info`.

## Current state

What exists in the repo today:

- Config node (`nodes/config/`): holds Site ID and an encrypted API key. Also serves an admin endpoint `/processlink/locations/:id` that fetches areas and folders for the editor, with an allowlist of hosts for redirects and a redirect limit.
- Files upload node: uploads a payload to Process Link Files, with filename sanitisation, optional folder and timestamp prefix, and `msg.file_id` on success.
- Mail node: sends email through ProcessMail (To, CC, BCC, Reply-To, text or HTML, attachments from `msg.file_id` or `msg.attachments`).
- SMS node: sends SMS through ProcessMail, E.164 phone validation.
- Notify group node: sends to a ProcessMail notification group by `group_key`, with optional branded template and link-only attachments.
- System info node: outputs device diagnostics (hostname, platform, memory, disk, network, uptime, Node-RED version).
- Action nodes use two outputs (success, error), status indicators, a clamped timeout (5 to 300 seconds), a 1 MB response cap and status timer cleanup on close (per `docs/plans/2026-02-18_NodeRED_GoLive.md`).
- Example flow: `examples/demo-flow.json`.
- Tests: unit tests for each node in `tests/`, integration tests in `tests/integration/` for config, files upload, mail, notify group and system info. Jest coverage thresholds are low baselines (10 to 15 percent) in `jest.config.js`.
- Git workflow: feature branch, PR into `staging`, then `staging` into `main`. `.husky/pre-push` blocks direct pushes to those two branches.
- Last merged change: dev-dependency advisory clean-up (PR #3, 2026-08-01). No CI workflow exists in the repo (no `.github` directory).

Tests were not run while writing this file (guess: they pass, as the go-live audit reported 162+ passing at v1.9.1).

## In progress

- Nothing in progress is recorded in the repo. No open TODO or FIXME comments were found in `nodes/`, `tests/` or the docs.

## Next up

Taken from the "Nice to Have (Future)" list in `docs/plans/2026-02-18_NodeRED_GoLive.md` (all unchecked):

- Wrap `req.write()` and `req.end()` in try-catch across action nodes (race with the timeout destroy).
- Add a note to the system info help text that its output contains sensitive data (hostname, IP, MAC, username).
- Add SMS integration tests (`tests/integration/sms.integration.test.js`).

Other gaps seen in the repo:

- `CHANGELOG.md` stops at 1.9.0 while `package.json` is 1.9.2. Add entries for 1.9.1 and 1.9.2.
- No CI workflow runs `npm test` on pull requests (guess: wanted, not stated anywhere).
- `README.md` lists five nodes in the table and does not describe the config node separately. Check it stays accurate as nodes change.

## Open questions

- Should a GitHub Actions workflow be added to run tests, or is the local pre-push hook meant to be enough? The hook in this repo only guards branches; `CLAUDE.md` mentions Husky running `preflight`, but the repo has no `preflight` script. (guess: the `CLAUDE.md` wording is out of date)
- `CONTRIBUTING.md` says to open PRs against `main`, but `CLAUDE.md` and the pre-push hook say feature into `staging`, then `staging` into `main`. Which is current? (guess: the staging flow)
- The 1.9.1 audit says "162+ tests"; the current count is unverified.
- Is the publish step (`npm publish`) run manually by a person? The repo shows only `prepublishOnly: npm test`.

## Log

### 2026-10-02

- Added `docs/PROGRESS.md` from a read of the README, manifests, nodes, tests, hooks, changelog, the go-live audit and git history. No code changed. `CLAUDE.md` already existed and was left untouched.
