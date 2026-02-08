# CLAUDE.md - AI Assistant Guidelines

## Critical: This is a Published NPM Package

This package (`@processlink/node-red-contrib-processlink`) is **published to NPM** and used by real customers in production Node-RED environments. Changes here can break many people's workflows.

### Before Making Any Changes

1. **Understand the impact** - Changes affect all users who update the package
2. **Backwards compatibility** - Existing node configurations must continue to work
3. **Test thoroughly** - Test in a real Node-RED instance before publishing
4. **Version carefully** - Follow semver (patch for fixes, minor for features, major for breaking changes)

### Publishing Checklist

Before running `npm publish`:
- [ ] Test all nodes in Node-RED editor (deploy, configure, run)
- [ ] Verify existing flows still work after update
- [ ] Check browser console for JavaScript errors
- [ ] Test error handling paths
- [ ] Update version in package.json appropriately
- [ ] Document changes in commit message

## Architecture Notes

### Node-RED Security Model

**Important**: Credentials (API keys, passwords) are stored server-side only and are NEVER accessible from the browser/editor HTML code.

- `node.credentials.apiKey` - Only accessible in `.js` files (server-side)
- `configNode.credentials` - Always `undefined` in `.html` files (client-side)

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
    processlink-config.js    # Shared credentials config node
    processlink-config.html
  files/
    processlink-files-upload.js   # File upload node
    processlink-files-upload.html
  system/
    processlink-system-info.js    # System info node
    processlink-system-info.html
```

### Node-RED Conventions

- Dual outputs: First output for success, second for errors
- Status indicators: green=success, yellow=processing, red=error
- Config nodes: Store shared credentials, referenced by other nodes
- Always use `send` and `done` callbacks for proper async handling
