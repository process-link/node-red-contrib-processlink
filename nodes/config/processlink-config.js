/**
 * Process Link Configuration Node
 * Shared credentials for all Process Link nodes
 */

module.exports = function (RED) {
  function ProcessLinkConfigNode(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.siteId = config.siteId;
    // API key is stored in this.credentials.apiKey (encrypted by Node-RED)
  }

  RED.nodes.registerType("processlink-config", ProcessLinkConfigNode, {
    credentials: {
      apiKey: { type: "password" },
    },
  });
};
