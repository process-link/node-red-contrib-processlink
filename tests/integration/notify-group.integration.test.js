/**
 * Integration tests for processlink-notify-group node
 *
 * These tests verify the notify-group node works correctly
 * within a Node-RED runtime environment.
 */
const helper = require("./helper-setup");
const configNode = require("../../nodes/config/processlink-config");
const notifyGroupNode = require("../../nodes/notify/processlink-notify-group");

describe("processlink-notify-group integration", () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload().then(() => {
      helper.stopServer(done);
    });
  });

  it("should load the notify-group node", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
      },
      {
        id: "notify1",
        type: "processlink-notify-group",
        name: "Test Notify",
        server: "config1",
        groupKey: "test-group",
        subject: "Test Subject",
      },
    ];

    helper.load([configNode, notifyGroupNode], flow, () => {
      const n1 = helper.getNode("notify1");
      expect(n1).toBeTruthy();
      expect(n1.name).toBe("Test Notify");
      done();
    });
  });

  it("should set error status without config node", (done) => {
    const flow = [
      {
        id: "notify1",
        type: "processlink-notify-group",
        name: "Test Notify",
        server: "",
        wires: [[], []],
      },
    ];

    helper.load([configNode, notifyGroupNode], flow, () => {
      const notify = helper.getNode("notify1");
      expect(notify).toBeTruthy();

      notify.receive({
        group_key: "test-group",
        subject: "Test",
        body: "Test body",
      });

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
        id: "notify1",
        type: "processlink-notify-group",
        server: "config1",
        wires: [["success1"], ["error1"]],
      },
      { id: "success1", type: "helper" },
      { id: "error1", type: "helper" },
    ];
    const credentials = {
      config1: { apiKey: "test-key" },
    };

    helper.load([configNode, notifyGroupNode], flow, credentials, () => {
      const notify = helper.getNode("notify1");
      expect(notify).toBeTruthy();
      expect(notify.wires).toHaveLength(2);
      done();
    });
  });

  it("should output to error port when group_key is missing", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
      },
      {
        id: "notify1",
        type: "processlink-notify-group",
        server: "config1",
        groupKey: "",
        subject: "",
        wires: [["success1"], ["error1"]],
      },
      { id: "success1", type: "helper" },
      { id: "error1", type: "helper" },
    ];
    const credentials = {
      config1: { apiKey: "test-key" },
    };

    helper.load([configNode, notifyGroupNode], flow, credentials, () => {
      const errorHelper = helper.getNode("error1");

      errorHelper.on("input", (msg) => {
        expect(msg.payload.error).toContain("group_key");
        done();
      });

      const notify = helper.getNode("notify1");
      notify.receive({ subject: "Test", body: "Test body" });
    });
  });

  it("should output to error port when subject is missing", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
      },
      {
        id: "notify1",
        type: "processlink-notify-group",
        server: "config1",
        groupKey: "",
        subject: "",
        wires: [["success1"], ["error1"]],
      },
      { id: "success1", type: "helper" },
      { id: "error1", type: "helper" },
    ];
    const credentials = {
      config1: { apiKey: "test-key" },
    };

    helper.load([configNode, notifyGroupNode], flow, credentials, () => {
      const errorHelper = helper.getNode("error1");

      errorHelper.on("input", (msg) => {
        expect(msg.payload.error).toContain("subject");
        done();
      });

      const notify = helper.getNode("notify1");
      notify.receive({ group_key: "test-group", body: "Test body" });
    });
  });

  it("should reference config node correctly", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Notify Config",
        siteId: "notify-site-123",
      },
      {
        id: "notify1",
        type: "processlink-notify-group",
        name: "Test Notify",
        server: "config1",
      },
    ];
    const credentials = {
      config1: { apiKey: "notify-api-key" },
    };

    helper.load([configNode, notifyGroupNode], flow, credentials, () => {
      const notify = helper.getNode("notify1");
      expect(notify).toBeTruthy();
      expect(notify.server).toBeTruthy();
      expect(notify.server.credentials.apiKey).toBe("notify-api-key");
      done();
    });
  });
});
