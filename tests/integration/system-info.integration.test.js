/**
 * Integration tests for processlink-system-info node
 *
 * These tests verify the system-info node works correctly
 * within a Node-RED runtime environment.
 */
const helper = require("./helper-setup");
const systemInfoNode = require("../../nodes/system/processlink-system-info");

describe("processlink-system-info integration", () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload().then(() => {
      helper.stopServer(done);
    });
  });

  it("should load the system-info node", (done) => {
    const flow = [
      {
        id: "sysinfo1",
        type: "processlink-system-info",
        name: "Test System Info",
      },
    ];

    helper.load([systemInfoNode], flow, () => {
      const n1 = helper.getNode("sysinfo1");
      expect(n1).toBeTruthy();
      expect(n1.name).toBe("Test System Info");
      done();
    });
  });

  it("should output system info on input", (done) => {
    const flow = [
      {
        id: "sysinfo1",
        type: "processlink-system-info",
        name: "Test System Info",
        wires: [["output1"]],
      },
      { id: "output1", type: "helper" },
    ];

    helper.load([systemInfoNode], flow, () => {
      const outputHelper = helper.getNode("output1");

      outputHelper.on("input", (msg) => {
        // Verify key fields exist in output
        expect(msg.payload).toBeTruthy();
        expect(msg.payload.hostname).toBeTruthy();
        expect(msg.payload.platform).toBeTruthy();
        expect(msg.payload.timestamp).toBeTruthy();
        expect(msg.payload.memory).toBeTruthy();
        expect(msg.payload.memory.total).toBeTruthy();
        expect(msg.payload.cpu).toBeTruthy();
        expect(msg.payload.uptime).toBeTruthy();
        expect(msg.payload.nodejs).toBeTruthy();
        expect(msg.payload.nodejs.version).toBeTruthy();
        done();
      });

      const sysinfo = helper.getNode("sysinfo1");
      sysinfo.receive({});
    });
  });

  it("should have single output", (done) => {
    const flow = [
      {
        id: "sysinfo1",
        type: "processlink-system-info",
        name: "Test System Info",
        wires: [["output1"]],
      },
      { id: "output1", type: "helper" },
    ];

    helper.load([systemInfoNode], flow, () => {
      const sysinfo = helper.getNode("sysinfo1");
      expect(sysinfo).toBeTruthy();
      expect(sysinfo.wires).toHaveLength(1);
      done();
    });
  });

  it("should include formatted memory values", (done) => {
    const flow = [
      {
        id: "sysinfo1",
        type: "processlink-system-info",
        wires: [["output1"]],
      },
      { id: "output1", type: "helper" },
    ];

    helper.load([systemInfoNode], flow, () => {
      const outputHelper = helper.getNode("output1");

      outputHelper.on("input", (msg) => {
        // Verify memory has both bytes and formatted values
        expect(msg.payload.memory.total.bytes).toBeGreaterThan(0);
        expect(msg.payload.memory.total.formatted).toBeTruthy();
        expect(msg.payload.memory.free.bytes).toBeGreaterThanOrEqual(0);
        expect(msg.payload.memory.used.bytes).toBeGreaterThan(0);
        expect(msg.payload.memory.usedPercent).toBeGreaterThanOrEqual(0);
        expect(msg.payload.memory.usedPercent).toBeLessThanOrEqual(100);
        done();
      });

      const sysinfo = helper.getNode("sysinfo1");
      sysinfo.receive({});
    });
  });
});
