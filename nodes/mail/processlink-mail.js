/**
 * Process Link Mail Node
 * Sends emails via the ProcessMail API
 */

module.exports = function (RED) {
  const https = require("https");
  const http = require("http");

  function ProcessLinkMailNode(config) {
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

      const apiKey = node.server.credentials?.apiKey;

      if (!apiKey) {
        node.status({ fill: "red", shape: "ring", text: "no API key" });
        done(new Error("API Key not configured"));
        return;
      }

      // Get email data from config or msg (config takes priority)
      const to = config.to || msg.to;
      const subject = config.subject || msg.subject || msg.topic;
      const body = config.body || (typeof msg.payload === "string" ? msg.payload : JSON.stringify(msg.payload));
      const bodyType = config.bodyType || msg.bodyType || "text";

      // Optional fields
      const cc = config.cc || msg.cc;
      const bcc = config.bcc || msg.bcc;
      const replyTo = config.replyTo || msg.replyTo;
      // Support both msg.attachments array and direct msg.file_id from upload node
      let attachments = msg.attachments;
      if (!attachments && msg.file_id) {
        // Auto-convert single file_id to attachments array for direct upload→mail connection
        attachments = [{ fileId: msg.file_id }];
      }

      // Validate required fields
      if (!to) {
        node.status({ fill: "red", shape: "ring", text: "missing 'to'" });
        msg.payload = { error: "Missing required field: to" };
        send([null, msg]);
        done(new Error("Missing required field: to"));
        return;
      }
      if (!subject) {
        node.status({ fill: "red", shape: "ring", text: "missing subject" });
        msg.payload = { error: "Missing required field: subject" };
        send([null, msg]);
        done(new Error("Missing required field: subject"));
        return;
      }
      if (!body) {
        node.status({ fill: "red", shape: "ring", text: "missing body" });
        msg.payload = { error: "Missing required field: body (msg.payload)" };
        send([null, msg]);
        done(new Error("Missing required field: body"));
        return;
      }

      // Build request body
      const requestBody = {
        to: to,
        subject: subject,
        body: body,
        bodyType: bodyType,
      };

      if (cc) requestBody.cc = cc;
      if (bcc) requestBody.bcc = bcc;
      if (replyTo) requestBody.replyTo = replyTo;
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        requestBody.attachments = attachments;
      }

      const bodyString = JSON.stringify(requestBody);

      // Parse URL
      const apiUrl = config.apiUrl || "https://processmail.processlink.com.au/api/send";
      const url = new URL(apiUrl);
      const isHttps = url.protocol === "https:";

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyString),
          "Authorization": `Bearer ${apiKey}`,
        },
      };

      // Show recipient in status
      const recipientLabel = Array.isArray(to) ? to[0] : to;
      node.status({ fill: "yellow", shape: "dot", text: "sending..." });

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

          msg.statusCode = res.statusCode;

          if (res.statusCode === 200 && parsedResponse.ok) {
            // Success - send to output 1 with clean payload
            msg.payload = {
              ok: true,
              status: parsedResponse.status || "sent",
              email_id: parsedResponse.email_id,
              resend_id: parsedResponse.resend_id,
              attachments_count: parsedResponse.attachments_count || 0,
            };
            // Include warning if logging failed on server
            if (parsedResponse.log_warning) {
              msg.payload.log_warning = parsedResponse.log_warning;
            }
            // Convenience properties for easy wiring
            msg.email_id = parsedResponse.email_id;
            msg.resend_id = parsedResponse.resend_id;
            node.status({
              fill: "green",
              shape: "dot",
              text: "sent to " + recipientLabel,
            });
            send([msg, null]);
            done();

            // Clear status after 5 seconds
            setTimeout(() => { node.status({}); }, 5000);
          } else {
            // API error - send to output 2
            const errorMsg = parsedResponse.error || parsedResponse.message || `HTTP ${res.statusCode}`;
            msg.payload = {
              ok: false,
              error: errorMsg,
              code: parsedResponse.code,
            };
            node.status({ fill: "red", shape: "dot", text: errorMsg });

            send([null, msg]);
            done(new Error(errorMsg));

            // Clear status after 10 seconds
            setTimeout(() => { node.status({}); }, 10000);
          }
        });
      });

      req.on("error", (err) => {
        node.status({ fill: "red", shape: "ring", text: "request failed" });
        msg.payload = { error: err.message };
        msg.statusCode = 0;
        send([null, msg]);
        done(err);

        setTimeout(() => { node.status({}); }, 10000);
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

        setTimeout(() => { node.status({}); }, 10000);
      });

      req.write(bodyString);
      req.end();
    });

    node.on("close", function () {
      node.status({});
    });
  }

  RED.nodes.registerType("processlink-mail", ProcessLinkMailNode);
};
