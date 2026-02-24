# Node-RED Package — Go-Live Audit
**Date:** 2026-02-18
**Package:** @processlink/node-red-contrib-processlink v1.9.1
**Scope:** Full repository (JS nodes, HTML editors, tests, package config, security)
**Verdict:** READY. No critical blockers. All priority fixes applied.

---

## Must Fix Before Go-Live

None. No critical or must-fix issues identified.

---

## Fixes Applied

- [x] **Timeout field clamped to safe bounds (5s–300s)**
  - All 4 action nodes: files-upload, mail, sms, notify-group
  - `Math.max(5000, Math.min(300000, parseInt(config.timeout, 10) || 30000))`

- [x] **Status timer tracking and cleanup on node close**
  - All 5 node files now track `statusTimer` and clear it in `close` handler
  - Prevents orphaned timers firing on destroyed nodes after redeploy

- [x] **SMS unit tests added**
  - New `tests/sms.test.js` covering phone validation, input validation, config priority, request body building, phone display truncation

- [x] **`console.log` replaced with `RED.log` in config node**
  - 10 occurrences replaced with `RED.log.debug()` or `RED.log.warn()` as appropriate

- [x] **`var` replaced with `const` in sms and notify-group nodes**
  - Consistent with rest of codebase

- [x] **Response accumulation capped at 1MB**
  - All 4 action nodes now abort if API response exceeds 1MB
  - Defense-in-depth against misbehaving server responses

- [x] **Integration tests added for notify-group and system-info**
  - `tests/integration/notify-group.integration.test.js` — node loading, dual outputs, error ports, config reference
  - `tests/integration/system-info.integration.test.js` — node loading, output structure, memory values

---

## Positive Findings

- **Zero production dependencies** — ideal for Node-RED packages
- **Credential handling is correct** — API keys use Node-RED's encrypted credential system, never accessible client-side
- **SSRF prevention** — `ALLOWED_HOSTS` allowlist with redirect limit in config node
- **Filename sanitization** — path separators, control chars, quotes, CRLF injection, 255-char length limit
- **Dual-output pattern** — all action nodes properly use output 1 (success) / output 2 (error)
- **Help text** — all 6 HTML files have comprehensive, well-structured help documentation
- **Example flows** — clean demo-flow.json with 9 examples, no credentials
- **`.npmignore`** — properly excludes tests, docs, IDE files, local credentials
- **`prepublishOnly: npm test`** — ensures tests pass before publish
- **162+ tests passing** across 10+ test files

---

## Test Coverage

| Node | Unit Test | Integration Test |
|------|-----------|------------------|
| processlink-config | config.test.js | config.integration.test.js |
| processlink-files-upload | files-upload.test.js | files-upload.integration.test.js |
| processlink-mail | mail.test.js | mail.integration.test.js |
| processlink-sms | sms.test.js | — |
| processlink-notify-group | notify-group.test.js | notify-group.integration.test.js |
| processlink-system-info | system-info.test.js | system-info.integration.test.js |

---

## Nice to Have (Future)

- [ ] Wrap `req.write()`/`req.end()` in try-catch across action nodes (race with timeout destroy)
- [ ] Add note to system-info help text that output contains sensitive data (hostname, IP, MAC, username)
- [ ] Add SMS integration tests (`tests/integration/sms.integration.test.js`)
