/**
 * Process Link System Info Node
 * Outputs system information for diagnostics and monitoring
 */

module.exports = function (RED) {
  const os = require("os");
  const { exec } = require("child_process");
  const util = require("util");
  const execAsync = util.promisify(exec);

  /**
   * Format bytes to human-readable string
   * @param {number} bytes
   * @returns {string}
   */
  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
  }

  /**
   * Convert seconds to broken-down time object
   * @param {number} totalSeconds
   * @returns {object}
   */
  function formatUptime(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return {
      raw: Math.floor(totalSeconds),
      breakdown: {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
      },
      formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
  }

  /**
   * Get primary network interface info (first non-internal IPv4)
   * @returns {object}
   */
  function getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    let primaryIP = null;
    let primaryMAC = null;

    // Find first non-internal IPv4 address
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          if (!primaryIP) {
            primaryIP = iface.address;
            primaryMAC = iface.mac;
          }
        }
      }
    }

    return {
      interfaces: interfaces,
      primaryIP: primaryIP || "unknown",
      mac: primaryMAC || "unknown",
    };
  }

  /**
   * Get disk space information (cross-platform)
   * Uses async exec to avoid blocking the event loop
   * @returns {Promise<object|null>}
   */
  async function getDiskInfo() {
    try {
      const platform = os.platform();
      let total, free, used;

      if (platform === "win32") {
        // Windows: use wmic
        const { stdout } = await execAsync(
          "wmic logicaldisk where drivetype=3 get size,freespace",
          { timeout: 5000 }
        );
        const lines = stdout.trim().split("\n").filter((l) => l.trim());
        if (lines.length > 1) {
          // Sum all drives
          total = 0;
          free = 0;
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].trim().split(/\s+/);
            if (parts.length >= 2) {
              free += parseInt(parts[0]) || 0;
              total += parseInt(parts[1]) || 0;
            }
          }
          used = total - free;
        }
      } else {
        // Linux/Mac: use df
        const { stdout } = await execAsync("df -B1 / | tail -1", { timeout: 5000 });
        const parts = stdout.trim().split(/\s+/);
        if (parts.length >= 4) {
          total = parseInt(parts[1]) || 0;
          used = parseInt(parts[2]) || 0;
          free = parseInt(parts[3]) || 0;
        }
      }

      if (total && total > 0) {
        return {
          total: {
            bytes: total,
            formatted: formatBytes(total),
          },
          free: {
            bytes: free,
            formatted: formatBytes(free),
          },
          used: {
            bytes: used,
            formatted: formatBytes(used),
          },
          usedPercent: Math.round((used / total) * 100),
        };
      }
    } catch (e) {
      // Disk info unavailable
    }
    return null;
  }

  /**
   * Get Node-RED version
   * @returns {string}
   */
  function getNodeRedVersion() {
    try {
      return RED.version();
    } catch (e) {
      return "unknown";
    }
  }

  /**
   * Collect all system information
   * @param {number} nodeRedStartTime - timestamp when Node-RED started
   * @returns {Promise<object>}
   */
  async function collectSystemInfo(nodeRedStartTime) {
    const now = new Date();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();
    const processMemory = process.memoryUsage();
    const networkInfo = getNetworkInfo();
    const diskInfo = await getDiskInfo();

    // Calculate Node-RED uptime
    const nodeRedUptimeSeconds = (Date.now() - nodeRedStartTime) / 1000;

    const info = {
      timestamp: now.toISOString(),
      localTime: now.toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      hostname: os.hostname(),
      platform: os.platform(),
      os: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      user: os.userInfo().username,
      workingDirectory: process.cwd(),

      uptime: formatUptime(os.uptime()),

      cpu: {
        model: cpus.length > 0 ? cpus[0].model : "unknown",
        cores: cpus.length,
        arch: os.arch(),
      },

      memory: {
        total: {
          bytes: totalMem,
          formatted: formatBytes(totalMem),
        },
        free: {
          bytes: freeMem,
          formatted: formatBytes(freeMem),
        },
        used: {
          bytes: usedMem,
          formatted: formatBytes(usedMem),
        },
        usedPercent: Math.round((usedMem / totalMem) * 100),
      },

      network: networkInfo,

      nodeRed: {
        version: getNodeRedVersion(),
        uptime: formatUptime(nodeRedUptimeSeconds),
      },

      nodejs: {
        version: process.version,
      },

      processMemory: {
        rss: {
          bytes: processMemory.rss,
          formatted: formatBytes(processMemory.rss),
        },
        heapTotal: {
          bytes: processMemory.heapTotal,
          formatted: formatBytes(processMemory.heapTotal),
        },
        heapUsed: {
          bytes: processMemory.heapUsed,
          formatted: formatBytes(processMemory.heapUsed),
        },
      },
    };

    // Add disk info if available
    if (diskInfo) {
      info.disk = diskInfo;
    }

    return info;
  }

  function ProcessLinkSystemInfoNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Record when this node was created (proxy for Node-RED start time)
    const nodeRedStartTime = Date.now();

    // Send on deploy if enabled
    if (config.sendOnDeploy) {
      // Small delay to let Node-RED fully initialize
      setTimeout(async () => {
        try {
          const info = await collectSystemInfo(nodeRedStartTime);
          node.send({ payload: info });
          node.status({
            fill: "green",
            shape: "dot",
            text: `sent @ ${new Date().toLocaleTimeString()}`,
          });
          setTimeout(() => node.status({}), 5000);
        } catch (err) {
          node.status({ fill: "red", shape: "ring", text: "error" });
          node.error(err);
          setTimeout(() => node.status({}), 10000);
        }
      }, 1000);
    }

    node.on("input", async function (msg, send, done) {
      // For Node-RED 0.x compatibility
      send = send || function () { node.send.apply(node, arguments); };
      done = done || function (err) { if (err) node.error(err, msg); };

      try {
        node.status({ fill: "yellow", shape: "dot", text: "collecting..." });

        const info = await collectSystemInfo(nodeRedStartTime);
        msg.payload = info;

        node.status({
          fill: "green",
          shape: "dot",
          text: `sent @ ${new Date().toLocaleTimeString()}`,
        });

        send(msg);
        done();

        // Clear status after 5 seconds
        setTimeout(() => node.status({}), 5000);
      } catch (err) {
        node.status({ fill: "red", shape: "ring", text: "error" });
        done(err);
        setTimeout(() => node.status({}), 10000);
      }
    });

    node.on("close", function () {
      node.status({});
    });
  }

  RED.nodes.registerType("processlink-system-info", ProcessLinkSystemInfoNode);
};
