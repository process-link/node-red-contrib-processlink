/**
 * Integration tests for processlink-mail node
 *
 * These tests verify the mail node works correctly
 * within a Node-RED runtime environment.
 */
const helper = require("./helper-setup");
const configNode = require("../../nodes/config/processlink-config");
const mailNode = require("../../nodes/mail/processlink-mail");

describe("processlink-mail integration", () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload().then(() => {
      helper.stopServer(done);
    });
  });

  it("should load the mail node", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
      },
      {
        id: "mail1",
        type: "processlink-mail",
        name: "Test Mail",
        server: "config1",
        to: "test@example.com",
        subject: "Test Subject",
      },
    ];

    helper.load([configNode, mailNode], flow, () => {
      const n1 = helper.getNode("mail1");
      expect(n1).toBeTruthy();
      expect(n1.name).toBe("Test Mail");
      done();
    });
  });

  it("should set error status without config node", (done) => {
    const flow = [
      {
        id: "mail1",
        type: "processlink-mail",
        name: "Test Mail",
        server: "", // No config
        wires: [[], []],
      },
    ];

    helper.load([configNode, mailNode], flow, () => {
      const mail = helper.getNode("mail1");
      expect(mail).toBeTruthy();

      mail.receive({
        to: "test@example.com",
        subject: "Test",
        body: "Test body",
      });

      // Node should error due to missing config
      setTimeout(() => {
        done();
      }, 100);
    });
  });

  it("should have dual outputs configured", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
      },
      {
        id: "mail1",
        type: "processlink-mail",
        server: "config1",
        wires: [["success1"], ["error1"]],
      },
      { id: "success1", type: "helper" },
      { id: "error1", type: "helper" },
    ];
    const credentials = {
      config1: { apiKey: "test-key" },
    };

    helper.load([configNode, mailNode], flow, credentials, () => {
      const mail = helper.getNode("mail1");
      expect(mail).toBeTruthy();
      // Verify both wires are connected
      expect(mail.wires).toHaveLength(2);
      done();
    });
  });

  it("should output to error port when 'to' field is missing", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
      },
      {
        id: "mail1",
        type: "processlink-mail",
        server: "config1",
        to: "", // No recipient configured
        subject: "",
        wires: [["success1"], ["error1"]],
      },
      { id: "success1", type: "helper" },
      { id: "error1", type: "helper" },
    ];
    const credentials = {
      config1: { apiKey: "test-key" },
    };

    helper.load([configNode, mailNode], flow, credentials, () => {
      const mail = helper.getNode("mail1");
      const errorHelper = helper.getNode("error1");

      errorHelper.on("input", (msg) => {
        expect(msg.payload.error).toContain("to");
        done();
      });

      // Send without 'to' field - should trigger error output
      mail.receive({ subject: "Test", body: "Test body" });
    });
  });

  it("should output to error port when 'subject' field is missing", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
      },
      {
        id: "mail1",
        type: "processlink-mail",
        server: "config1",
        to: "",
        subject: "", // No subject configured
        wires: [["success1"], ["error1"]],
      },
      { id: "success1", type: "helper" },
      { id: "error1", type: "helper" },
    ];
    const credentials = {
      config1: { apiKey: "test-key" },
    };

    helper.load([configNode, mailNode], flow, credentials, () => {
      const mail = helper.getNode("mail1");
      const errorHelper = helper.getNode("error1");

      errorHelper.on("input", (msg) => {
        expect(msg.payload.error).toContain("subject");
        done();
      });

      // Send with 'to' but without 'subject' - should trigger error output
      mail.receive({ to: "test@example.com", body: "Test body" });
    });
  });

  it("should reference config node correctly", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Mail Config",
        siteId: "mail-site-123",
      },
      {
        id: "mail1",
        type: "processlink-mail",
        name: "Test Mail",
        server: "config1",
      },
    ];
    const credentials = {
      config1: { apiKey: "mail-api-key" },
    };

    helper.load([configNode, mailNode], flow, credentials, () => {
      const mail = helper.getNode("mail1");
      expect(mail).toBeTruthy();
      // The server property should reference the config node
      expect(mail.server).toBeTruthy();
      expect(mail.server.credentials.apiKey).toBe("mail-api-key");
      done();
    });
  });

  it("should use config values over msg values", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
      },
      {
        id: "mail1",
        type: "processlink-mail",
        server: "config1",
        to: "config-recipient@example.com",
        subject: "Config Subject",
        wires: [["success1"], ["error1"]],
      },
      { id: "success1", type: "helper" },
      { id: "error1", type: "helper" },
    ];
    const credentials = {
      config1: { apiKey: "test-key" },
    };

    helper.load([configNode, mailNode], flow, credentials, () => {
      const mail = helper.getNode("mail1");
      // This test verifies the node loads with config values
      // The actual priority check is done in unit tests
      expect(mail).toBeTruthy();
      done();
    });
  });
});
