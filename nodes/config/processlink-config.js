/**
 * Process Link Configuration Node
 * Shared credentials for all Process Link nodes
 */

module.exports = function (RED) {
  const https = require("https");

  // Helper to make HTTPS request that follows redirects
  function httpsGet(options, callback) {
    const req = https.request(options, (res) => {
      // Follow redirects (301, 302, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const location = res.headers.location;
        let redirectOptions;

        if (location.startsWith("http")) {
          // Absolute URL
          const redirectUrl = new URL(location);
          redirectOptions = {
            hostname: redirectUrl.hostname,
            path: redirectUrl.pathname + redirectUrl.search,
            method: "GET",
            headers: options.headers,
          };
        } else {
          // Relative URL - keep same host
          redirectOptions = {
            hostname: options.hostname,
            path: location,
            method: "GET",
            headers: options.headers,
          };
        }

        console.log(`[ProcessLink] Following redirect to: ${redirectOptions.hostname}${redirectOptions.path}`);
        httpsGet(redirectOptions, callback);
        return;
      }
      callback(res);
    });
    req.on("error", (err) => {
      callback(null, err);
    });
    req.end();
  }

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
    httpsGet(
      {
        hostname: "files.processlink.com.au",
        path: `${baseUrl}/areas`,
        method: "GET",
        headers: headers,
      },
      (areasRes, err) => {
        if (err) {
          console.log(`[ProcessLink] Areas request error:`, err.message);
          if (!hasError) {
            hasError = true;
            res.status(500).json({ error: "Failed to fetch areas" });
          }
          return;
        }
        let data = "";
        areasRes.on("data", (chunk) => (data += chunk));
        areasRes.on("end", () => {
          if (areasRes.statusCode !== 200) {
            console.log(`[ProcessLink] Areas API returned ${areasRes.statusCode}: ${data}`);
            areasData = [];
          } else {
            try {
              areasData = JSON.parse(data);
              if (!Array.isArray(areasData)) {
                console.log(`[ProcessLink] Areas API returned non-array:`, areasData);
                areasData = [];
              }
            } catch (e) {
              console.log(`[ProcessLink] Areas API parse error:`, e.message);
              areasData = [];
            }
          }
          checkComplete();
        });
      }
    );

    // Fetch folders
    httpsGet(
      {
        hostname: "files.processlink.com.au",
        path: `${baseUrl}/folders`,
        method: "GET",
        headers: headers,
      },
      (foldersRes, err) => {
        if (err) {
          console.log(`[ProcessLink] Folders request error:`, err.message);
          if (!hasError) {
            hasError = true;
            res.status(500).json({ error: "Failed to fetch folders" });
          }
          return;
        }
        let data = "";
        foldersRes.on("data", (chunk) => (data += chunk));
        foldersRes.on("end", () => {
          if (foldersRes.statusCode !== 200) {
            console.log(`[ProcessLink] Folders API returned ${foldersRes.statusCode}: ${data}`);
            foldersData = [];
          } else {
            try {
              foldersData = JSON.parse(data);
              if (!Array.isArray(foldersData)) {
                console.log(`[ProcessLink] Folders API returned non-array:`, foldersData);
                foldersData = [];
              }
            } catch (e) {
              console.log(`[ProcessLink] Folders API parse error:`, e.message);
              foldersData = [];
            }
          }
          checkComplete();
        });
      }
    );
  });
};
