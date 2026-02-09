/**
 * Integration tests for processlink-config node
 *
 * These tests verify the config node works correctly
 * within a Node-RED runtime environment.
 */
const helper = require("./helper-setup");
const configNode = require("../../nodes/config/processlink-config");

describe("processlink-config integration", () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload().then(() => {
      helper.stopServer(done);
    });
  });

  it("should load the config node", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
        siteId: "test-site-123",
      },
    ];
    const credentials = {
      config1: { apiKey: "test-api-key-123" },
    };

    helper.load(configNode, flow, credentials, () => {
      const n1 = helper.getNode("config1");
      expect(n1).toBeTruthy();
      expect(n1.name).toBe("Test Config");
      expect(n1.siteId).toBe("test-site-123");
      done();
    });
  });

  it("should store credentials securely", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
        siteId: "test-site",
      },
    ];
    const credentials = {
      config1: { apiKey: "secret-key-456" },
    };

    helper.load(configNode, flow, credentials, () => {
      const n1 = helper.getNode("config1");
      expect(n1.credentials.apiKey).toBe("secret-key-456");
      done();
    });
  });

  it("should load without credentials", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Config Without Credentials",
        siteId: "test-site",
      },
    ];

    helper.load(configNode, flow, () => {
      const n1 = helper.getNode("config1");
      expect(n1).toBeTruthy();
      expect(n1.name).toBe("Config Without Credentials");
      // Credentials should be empty object or undefined
      expect(n1.credentials?.apiKey).toBeUndefined();
      done();
    });
  });

  it("should handle empty siteId", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "No Site",
        siteId: "",
      },
    ];

    helper.load(configNode, flow, () => {
      const n1 = helper.getNode("config1");
      expect(n1).toBeTruthy();
      expect(n1.siteId).toBe("");
      done();
    });
  });
});
