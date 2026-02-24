/**
 * Process Link SMS Node
 * Sends SMS messages via the ProcessMail API
 */

module.exports = function (RED) {
  const https = require("https");

  function ProcessLinkSmsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    let statusTimer;

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

      // Get SMS data from config or msg (config takes priority)
      const to = config.to || msg.to;
      const body = config.body || msg.body;

      // Validate required fields
      if (!to) {
        node.status({ fill: "red", shape: "ring", text: "missing 'to'" });
        msg.payload = { error: "Missing required field: to (phone number)" };
        send([null, msg]);
        done(new Error("Missing required field: to"));
        return;
      }
      if (!body) {
        node.status({ fill: "red", shape: "ring", text: "missing body" });
        msg.payload = { error: "Missing required field: body (message text)" };
        send([null, msg]);
        done(new Error("Missing required field: body"));
        return;
      }

      // Basic phone number validation
      const phoneStr = Array.isArray(to) ? to[0] : to;
      if (typeof phoneStr === "string" && !phoneStr.startsWith("+")) {
        node.status({ fill: "red", shape: "ring", text: "invalid phone" });
        msg.payload = { error: "Phone number must start with '+' (E.164 format, e.g., +61412345678)" };
        send([null, msg]);
        done(new Error("Invalid phone number format"));
        return;
      }

      // Build request body
      const requestBody = {
        to: to,
        body: body,
      };

      const bodyString = JSON.stringify(requestBody);

      // API endpoint
      const apiUrl = new URL("https://processmail.processlink.com.au/api/v1/send-sms");

      const options = {
        hostname: apiUrl.hostname,
        port: 443,
        path: apiUrl.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyString),
          "Authorization": `Bearer ${apiKey}`,
        },
      };

      // Show recipient in status
      const recipientLabel = Array.isArray(to) ? to[0] : to;
      const shortPhone = recipientLabel.length > 10
        ? recipientLabel.slice(0, 4) + "..." + recipientLabel.slice(-4)
        : recipientLabel;
      node.status({ fill: "yellow", shape: "dot", text: "sending..." });

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
          if (responseData.length > 1024 * 1024) {
            req.destroy();
            node.status({ fill: "red", shape: "ring", text: "response too large" });
            msg.payload = { error: "API response exceeded 1MB limit" };
            msg.statusCode = 0;
            send([null, msg]);
            done(new Error("API response exceeded 1MB limit"));
            return;
          }
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
            // Success - send to output 1
            msg.payload = {
              ok: true,
              status: parsedResponse.status || "sent",
              message_id: parsedResponse.message_id,
              twilio_sid: parsedResponse.twilio_sid,
              segment_count: parsedResponse.segment_count || 1,
              recipients_count: parsedResponse.recipients_count || 1,
            };
            if (parsedResponse.log_warning) {
              msg.payload.log_warning = parsedResponse.log_warning;
            }
            // Convenience properties
            msg.message_id = parsedResponse.message_id;
            msg.twilio_sid = parsedResponse.twilio_sid;
            node.status({
              fill: "green",
              shape: "dot",
              text: "sent to " + shortPhone,
            });
            send([msg, null]);
            done();

            // Clear status after 5 seconds
            if (statusTimer) clearTimeout(statusTimer);
            statusTimer = setTimeout(() => { node.status({}); }, 5000);
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
            if (statusTimer) clearTimeout(statusTimer);
            statusTimer = setTimeout(() => { node.status({}); }, 10000);
          }
        });
      });

      req.on("error", (err) => {
        node.status({ fill: "red", shape: "ring", text: "request failed" });
        msg.payload = { error: err.message };
        msg.statusCode = 0;
        send([null, msg]);
        done(err);

        if (statusTimer) clearTimeout(statusTimer);
        statusTimer = setTimeout(() => { node.status({}); }, 10000);
      });

      // Set timeout
      const timeout = Math.max(5000, Math.min(300000, parseInt(config.timeout, 10) || 30000));
      req.setTimeout(timeout, () => {
        req.destroy();
        node.status({ fill: "red", shape: "ring", text: "timeout" });
        msg.payload = { error: "Request timed out" };
        msg.statusCode = 0;
        send([null, msg]);
        done(new Error("Request timed out"));

        if (statusTimer) clearTimeout(statusTimer);
        statusTimer = setTimeout(() => { node.status({}); }, 10000);
      });

      req.write(bodyString);
      req.end();
    });

    node.on("close", function () {
      if (statusTimer) clearTimeout(statusTimer);
      node.status({});
    });
  }

  RED.nodes.registerType("processlink-sms", ProcessLinkSmsNode);
};
