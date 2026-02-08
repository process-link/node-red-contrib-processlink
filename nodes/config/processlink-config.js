/**
 * Process Link Configuration Node
 * Shared credentials for all Process Link nodes
 */

module.exports = function (RED) {
  const https = require("https");

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

  // Admin endpoint to fetch locations (areas and folders) for a config node
  RED.httpAdmin.get("/processlink/locations/:id", function (req, res) {
    const configNode = RED.nodes.getNode(req.params.id);
    if (!configNode) {
      return res.status(404).json({ error: "Config node not found" });
    }

    const siteId = configNode.siteId;
    const apiKey = configNode.credentials?.apiKey;

    if (!siteId || !apiKey) {
      return res.status(400).json({ error: "Config not ready" });
    }

    const baseUrl = `/api/sites/${siteId}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    // Fetch both areas and folders
    let areasData = [];
    let foldersData = [];
    let completed = 0;
    let hasError = false;

    function checkComplete() {
      completed++;
      if (completed === 2 && !hasError) {
        res.json({ areas: areasData, folders: foldersData });
      }
    }

    // Fetch areas
    const areasReq = https.request(
      {
        hostname: "files.processlink.com.au",
        path: `${baseUrl}/areas`,
        method: "GET",
        headers: headers,
      },
      (areasRes) => {
        let data = "";
        areasRes.on("data", (chunk) => (data += chunk));
        areasRes.on("end", () => {
          try {
            areasData = JSON.parse(data);
          } catch (e) {
            areasData = [];
          }
          checkComplete();
        });
      }
    );
    areasReq.on("error", () => {
      if (!hasError) {
        hasError = true;
        res.status(500).json({ error: "Failed to fetch areas" });
      }
    });
    areasReq.end();

    // Fetch folders
    const foldersReq = https.request(
      {
        hostname: "files.processlink.com.au",
        path: `${baseUrl}/folders`,
        method: "GET",
        headers: headers,
      },
      (foldersRes) => {
        let data = "";
        foldersRes.on("data", (chunk) => (data += chunk));
        foldersRes.on("end", () => {
          try {
            foldersData = JSON.parse(data);
          } catch (e) {
            foldersData = [];
          }
          checkComplete();
        });
      }
    );
    foldersReq.on("error", () => {
      if (!hasError) {
        hasError = true;
        res.status(500).json({ error: "Failed to fetch folders" });
      }
    });
    foldersReq.end();
  });
};
