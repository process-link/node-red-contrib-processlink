# CLAUDE.md - AI Assistant Guidelines

## Critical: This is a Published NPM Package

This package (`@processlink/node-red-contrib-processlink`) is **published to NPM** and used by real customers in production Node-RED environments. Changes here can break many people's workflows.

**Current version:** 1.9.2 (see `package.json`)

### Before Making Any Changes

1. **Understand the impact** — Changes affect all users who update the package
2. **Backwards compatibility** — Existing node configurations must continue to work
3. **Test thoroughly** — Run unit + integration tests AND test in a real Node-RED instance before publishing
4. **Version carefully** — Follow semver (patch for fixes, minor for features, major for breaking changes)

### Publishing Checklist

Before running `npm publish`:

- [ ] `npm test` passes (Jest) — `prepublishOnly` enforces this
- [ ] `npm run test:coverage` — coverage report sane
- [ ] Test all nodes in Node-RED editor (deploy, configure, run)
- [ ] Verify existing flows still work after update
- [ ] Check browser console for JavaScript errors
- [ ] Test error handling paths (check the error output on each node)
- [ ] Update version in `package.json` appropriately
- [ ] Document changes in `CHANGELOG.md`
- [ ] Commit + tag the release

## Commands

```bash
npm test                # Jest unit tests
npm run test:coverage   # With coverage report
```

## Architecture Notes

### Node-RED Security Model

**Important:** Credentials (API keys, passwords) are stored server-side only and are NEVER accessible from the browser/editor HTML code.

- `node.credentials.apiKey` — Only accessible in `.js` files (server-side)
- `configNode.credentials` — Always `undefined` in `.html` files (client-side)

To access credentials from the editor, create an admin HTTP endpoint:

```javascript
// In the .js file
RED.httpAdmin.get("/your-endpoint/:id", function(req, res) {
  const node = RED.nodes.getNode(req.params.id);
  const apiKey = node.credentials?.apiKey; // Access credentials here
  // Make API calls server-side, return results to client
});
```

### File Structure

```
nodes/
  config/
    processlink-config.js       # Shared credentials config node
    processlink-config.html
  files/
    processlink-files-upload.js # File upload node → files.processlink.com.au
    processlink-files-upload.html
  mail/
    processlink-mail.js         # Email send node → processmail
    processlink-mail.html
  sms/
    processlink-sms.js          # SMS send node → processmail
    processlink-sms.html
  notify/
    processlink-notify-group.js # Notification group send → processmail
    processlink-notify-group.html
  system/
    processlink-system-info.js  # System info / diagnostics node
    processlink-system-info.html
```

Each node type is registered in `package.json` under `"node-red": { "nodes": {...} }`.

### Node-RED Conventions

- **Dual outputs:** first output for success, second for errors
- **Status indicators:** green = success, yellow = processing, red = error
- **Config nodes:** store shared credentials (API key, site ID), referenced by other nodes
- Always use `send` and `done` callbacks for proper async handling
- HTTP calls use the native `https` module (no extra dependencies to keep the package lean)
- Brand accent for editor UI: ProcessLink orange (`#f97316`)

## Testing

Jest-based tests live under `tests/`:

- `tests/*.test.js` — Unit tests using `node-red-node-test-helper`
- `tests/integration/*.integration.test.js` — Integration tests hitting real endpoints (require test credentials)

Test config: `jest.config.js`. Runs via `npm test` (also enforced as `prepublishOnly`).

## Platform Integration

This package talks to Process Link platform APIs over HTTPS using centralised `plk_*` API keys. The shared platform context (auth, API envelope, API key format, scopes) lives in the sibling repo at [`../ProcessLink_PortalAndApps/platform-docs/`](../ProcessLink_PortalAndApps/platform-docs/).

Key endpoints this package calls:

- `files.processlink.com.au/api/v1/sites/{siteId}/files/upload` — File upload
- `processmail.processlink.com.au/api/v1/send-email` — Email send
- `processmail.processlink.com.au/api/v1/send-sms` — SMS send
- `processmail.processlink.com.au/api/v1/notify-group` — Notification group send

Scopes required per node are documented in the respective `.html` help panels.
