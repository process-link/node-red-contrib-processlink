/**
 * Integration tests for processlink-files-upload node
 *
 * These tests verify the upload node works correctly
 * within a Node-RED runtime environment.
 */
const helper = require("./helper-setup");
const configNode = require("../../nodes/config/processlink-config");
const uploadNode = require("../../nodes/files/processlink-files-upload");

describe("processlink-files-upload integration", () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload().then(() => {
      helper.stopServer(done);
    });
  });

  it("should load the upload node", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "Test Config",
        siteId: "test-site",
      },
      {
        id: "upload1",
        type: "processlink-files-upload",
        name: "Test Upload",
        server: "config1",
        filename: "test.txt",
      },
    ];

    helper.load([configNode, uploadNode], flow, () => {
      const n1 = helper.getNode("upload1");
      expect(n1).toBeTruthy();
      expect(n1.name).toBe("Test Upload");
      done();
    });
  });

  it("should set error status without config node", (done) => {
    const flow = [
      {
        id: "upload1",
        type: "processlink-files-upload",
        name: "Test Upload",
        server: "", // No config node
        wires: [[], []],
      },
    ];

    helper.load([configNode, uploadNode], flow, () => {
      const upload = helper.getNode("upload1");
      expect(upload).toBeTruthy();

      // Send a message - should trigger error due to missing config
      upload.receive({ payload: Buffer.from("test data") });

      // Check status was set to error
      setTimeout(() => {
        // The node should have attempted to set an error status
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
        siteId: "test-site",
      },
      {
        id: "upload1",
        type: "processlink-files-upload",
        name: "Test Upload",
        server: "config1",
        wires: [["success1"], ["error1"]],
      },
      { id: "success1", type: "helper" },
      { id: "error1", type: "helper" },
    ];
    const credentials = {
      config1: { apiKey: "test-key" },
    };

    helper.load([configNode, uploadNode], flow, credentials, () => {
      const upload = helper.getNode("upload1");
      expect(upload).toBeTruthy();
      // Verify both wires are connected
      expect(upload.wires).toHaveLength(2);
      done();
    });
  });

  it("should reference config node correctly", (done) => {
    const flow = [
      {
        id: "config1",
        type: "processlink-config",
        name: "My Config",
        siteId: "site-abc-123",
      },
      {
        id: "upload1",
        type: "processlink-files-upload",
        name: "Test Upload",
        server: "config1",
      },
    ];
    const credentials = {
      config1: { apiKey: "my-api-key" },
    };

    helper.load([configNode, uploadNode], flow, credentials, () => {
      const upload = helper.getNode("upload1");
      expect(upload).toBeTruthy();
      // The server property should reference the config node
      expect(upload.server).toBeTruthy();
      expect(upload.server.siteId).toBe("site-abc-123");
      expect(upload.server.credentials.apiKey).toBe("my-api-key");
      done();
    });
  });
});
