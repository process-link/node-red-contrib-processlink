/**
 * Process Link Files Upload Node
 * Uploads files to Process Link Files API
 */

module.exports = function (RED) {
  const https = require("https");
  const http = require("http");

  function ProcessLinkFilesUploadNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Get the config node
    this.server = RED.nodes.getNode(config.server);

    node.on("input", function (msg, send, done) {
      // For Node-RED 0.x compatibility
      send = send || function () { node.send.apply(node, arguments); };
      done = done || function (err) { if (err) node.error(err, msg); };

      // Validate config
      if (!node.server) {
        node.status({ fill: "red", shape: "ring", text: "no config" });
        done(new Error("No Process Link configuration selected"));
        return;
      }

      const siteId = node.server.siteId;
      const apiKey = node.server.credentials?.apiKey;

      if (!siteId) {
        node.status({ fill: "red", shape: "ring", text: "config missing Site ID" });
        done(new Error("Site ID required for file operations. Add a Site ID to your Process Link config node."));
        return;
      }

      if (!apiKey) {
        node.status({ fill: "red", shape: "ring", text: "no API key" });
        done(new Error("API Key not configured"));
        return;
      }

      // Validate payload
      let fileBuffer;
      if (Buffer.isBuffer(msg.payload)) {
        fileBuffer = msg.payload;
      } else if (typeof msg.payload === "string") {
        fileBuffer = Buffer.from(msg.payload);
      } else {
        node.status({ fill: "red", shape: "ring", text: "invalid payload" });
        done(new Error("msg.payload must be a Buffer or string"));
        return;
      }

      // Get filename (config takes priority over msg.filename)
      const filename = config.filename || msg.filename || "file.bin";
      let basename = filename.split(/[\\/]/).pop();

      // Add timestamp prefix if enabled
      if (config.timestampPrefix) {
        const now = new Date();
        const timestamp = now.getFullYear() + "-" +
          String(now.getMonth() + 1).padStart(2, "0") + "-" +
          String(now.getDate()).padStart(2, "0") + "_" +
          String(now.getHours()).padStart(2, "0") + "-" +
          String(now.getMinutes()).padStart(2, "0") + "-" +
          String(now.getSeconds()).padStart(2, "0");
        basename = timestamp + "_" + basename;
      }

      // Build multipart form data
      const boundary = "----NodeREDProcessLink" + Date.now() + Math.random().toString(36).substring(2);
      const parts = [];

      // Add file part
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${basename}"\r\n` +
        `Content-Type: application/octet-stream\r\n\r\n`
      ));
      parts.push(fileBuffer);

      // Add areaId if specified
      if (config.areaId) {
        parts.push(Buffer.from(
          `\r\n--${boundary}\r\n` +
          `Content-Disposition: form-data; name="areaId"\r\n\r\n` +
          config.areaId
        ));
      }

      // Add folderId if specified
      if (config.folderId) {
        parts.push(Buffer.from(
          `\r\n--${boundary}\r\n` +
          `Content-Disposition: form-data; name="folderId"\r\n\r\n` +
          config.folderId
        ));
      }

      // Add closing boundary
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

      const body = Buffer.concat(parts);

      // Parse URL
      const apiUrl = config.apiUrl || "https://files.processlink.com.au/api/upload";
      const url = new URL(apiUrl);
      const isHttps = url.protocol === "https:";

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
          "x-site-id": siteId,
          "Authorization": `Bearer ${apiKey}`,
        },
      };

      node.status({ fill: "yellow", shape: "dot", text: "uploading..." });

      const transport = isHttps ? https : http;
      const req = transport.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          let parsedResponse;
          try {
            parsedResponse = JSON.parse(responseData);
          } catch (e) {
            parsedResponse = { raw: responseData };
          }

          msg.payload = parsedResponse;
          msg.statusCode = res.statusCode;
          msg.headers = res.headers;

          if (res.statusCode === 201 && parsedResponse.ok) {
            // Success - send to output 1
            msg.file_id = parsedResponse.file_id;
            node.status({
              fill: "green",
              shape: "dot",
              text: `uploaded: ${parsedResponse.file_id?.substring(0, 8)}...`,
            });
            send([msg, null]);
            done();

            // Clear status after 5 seconds
            setTimeout(() => node.status({}), 5000);
          } else {
            // API error - send to output 2
            const errorMsg = parsedResponse.error || parsedResponse.message || `HTTP ${res.statusCode}`;
            node.status({ fill: "red", shape: "dot", text: errorMsg });

            send([null, msg]);
            done();

            // Clear status after 10 seconds
            setTimeout(() => node.status({}), 10000);
          }
        });
      });

      req.on("error", (err) => {
        node.status({ fill: "red", shape: "ring", text: "request failed" });
        msg.payload = { error: err.message };
        msg.statusCode = 0;
        send([null, msg]);
        done(err);

        setTimeout(() => node.status({}), 10000);
      });

      // Set timeout
      const timeout = parseInt(config.timeout) || 30000;
      req.setTimeout(timeout, () => {
        req.destroy();
        node.status({ fill: "red", shape: "ring", text: "timeout" });
        msg.payload = { error: "Request timed out" };
        msg.statusCode = 0;
        send([null, msg]);
        done(new Error("Request timed out"));

        setTimeout(() => node.status({}), 10000);
      });

      req.write(body);
      req.end();
    });

    node.on("close", function () {
      node.status({});
    });
  }

  RED.nodes.registerType("processlink-files-upload", ProcessLinkFilesUploadNode);
};
