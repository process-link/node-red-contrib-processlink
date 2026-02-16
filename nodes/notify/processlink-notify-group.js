/**
 * Process Link Notify Group Node
 * Sends notifications to a ProcessMail notification group.
 * Channel-agnostic: ProcessMail fans out to email/SMS per member preferences.
 */

module.exports = function (RED) {
  const https = require("https");

  function ProcessLinkNotifyGroupNode(config) {
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

      // Get notification data from config or msg (config takes priority)
      const groupKey = config.groupKey || msg.group_key;
      const subject = config.subject || msg.subject;
      const body = config.body || msg.body || msg.payload;
      const bodyType = config.bodyType || msg.bodyType || "text";

      // Template option (default: true)
      const useTemplate = config.useTemplate !== false && msg.useTemplate !== false;

      // Link only option (default: false)
      const linkOnly = config.linkOnly === true || msg.linkOnly === true;

      // Support file attachments from upload node
      let attachments = msg.attachments;
      if (!attachments && msg.file_id) {
        attachments = [{ fileId: msg.file_id }];
      }

      // Validate required fields
      if (!groupKey) {
        node.status({ fill: "red", shape: "ring", text: "missing group key" });
        msg.payload = { error: "Missing required field: group_key" };
        send([null, msg]);
        done(new Error("Missing required field: group_key"));
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
        msg.payload = { error: "Missing required field: body" };
        send([null, msg]);
        done(new Error("Missing required field: body"));
        return;
      }

      // Ensure body is a string
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body);

      // Build request body
      const requestBody = {
        group_key: groupKey,
        subject: subject,
        body: bodyStr,
        bodyType: bodyType,
        useTemplate: useTemplate,
      };

      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        if (linkOnly) {
          requestBody.fileLinks = attachments;
        } else {
          requestBody.attachments = attachments;
        }
      }

      const bodyString = JSON.stringify(requestBody);

      // API endpoint
      const apiUrl = new URL("https://processmail.processlink.com.au/api/v1/notify-group");

      const options = {
        hostname: apiUrl.hostname,
        port: 443,
        path: apiUrl.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyString),
          "Authorization": "Bearer " + apiKey,
        },
      };

      node.status({ fill: "yellow", shape: "dot", text: "notifying " + groupKey + "..." });

      const req = https.request(options, function (res) {
        let responseData = "";

        res.on("data", function (chunk) {
          responseData += chunk;
        });

        res.on("end", function () {
          let parsedResponse;
          try {
            parsedResponse = JSON.parse(responseData);
          } catch (e) {
            parsedResponse = { raw: responseData };
          }

          msg.statusCode = res.statusCode;

          if (res.statusCode === 200 && parsedResponse.ok) {
            // Success - send to output 1
            const sent = parsedResponse.notifications_sent || {};
            msg.payload = {
              ok: true,
              group_key: parsedResponse.group_key || groupKey,
              notifications_sent: sent,
              total_recipients: parsedResponse.total_recipients || 0,
              message_ids: parsedResponse.message_ids || [],
            };
            if (parsedResponse.failures) {
              msg.payload.failures = parsedResponse.failures;
            }

            // Convenience properties
            msg.group_key = parsedResponse.group_key || groupKey;

            const emailCount = sent.email || 0;
            const smsCount = sent.sms || 0;
            node.status({
              fill: "green",
              shape: "dot",
              text: emailCount + " email, " + smsCount + " sms",
            });

            send([msg, null]);
            done();

            // Clear status after 5 seconds
            setTimeout(function () { node.status({}); }, 5000);
          } else {
            // API error - send to output 2
            var errorMsg = parsedResponse.error || parsedResponse.message || ("HTTP " + res.statusCode);
            msg.payload = {
              ok: false,
              error: errorMsg,
              code: parsedResponse.code,
            };
            node.status({ fill: "red", shape: "dot", text: errorMsg });

            send([null, msg]);
            done(new Error(errorMsg));

            // Clear status after 10 seconds
            setTimeout(function () { node.status({}); }, 10000);
          }
        });
      });

      req.on("error", function (err) {
        node.status({ fill: "red", shape: "ring", text: "request failed" });
        msg.payload = { error: err.message };
        msg.statusCode = 0;
        send([null, msg]);
        done(err);

        setTimeout(function () { node.status({}); }, 10000);
      });

      // Set timeout
      var timeout = parseInt(config.timeout) || 30000;
      req.setTimeout(timeout, function () {
        req.destroy();
        node.status({ fill: "red", shape: "ring", text: "timeout" });
        msg.payload = { error: "Request timed out" };
        msg.statusCode = 0;
        send([null, msg]);
        done(new Error("Request timed out"));

        setTimeout(function () { node.status({}); }, 10000);
      });

      req.write(bodyString);
      req.end();
    });

    node.on("close", function () {
      node.status({});
    });
  }

  RED.nodes.registerType("processlink-notify-group", ProcessLinkNotifyGroupNode);
};
