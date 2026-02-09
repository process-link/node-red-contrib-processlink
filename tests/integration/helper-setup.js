/**
 * Test helper setup for Node-RED integration tests
 *
 * This module initializes the node-red-node-test-helper with
 * the Node-RED runtime for proper integration testing.
 */
const helper = require("node-red-node-test-helper");

// Initialize helper with node-red runtime
helper.init(require.resolve("node-red"));

module.exports = helper;
