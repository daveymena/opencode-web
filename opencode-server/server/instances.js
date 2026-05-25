const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let db = require("./db");
const processes = new Map();

function setDb(instance) {
  db = instance;
}

function getUserWorkspace(userId) {
  const base = process.env.WORKSPACE_ROOT || "/workspace";
  const dir = path.join(base, `user_${userId}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getUserConfigDir(userId) {
  const base = process.env.CONFIG_ROOT || "/home/opencode/.config/opencode/users";
  const dir = path.join(base, `user_${userId}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getUserDataDir(userId) {
  const base = process.env.DATA_ROOT || "/home/opencode/.local/share/opencode/users";
  const dir = path.join(base, `user_${userId}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function startInstance(userId) {
  if (processes.has(userId)) {
    const proc = processes.get(userId);
    if (!proc.killed) return proc.port;
  }

  const port = await db.getOrAssignPort(userId);
  const workspace = getUserWorkspace(userId);
  const configDir = getUserConfigDir(userId);
  const dataDir = getUserDataDir(userId);

  const env = {
    ...process.env,
    HOME: `/home/opencode`,
    XDG_CONFIG_HOME: configDir,
    XDG_DATA_HOME: dataDir,
    OPENCODE_CONFIG_DIR: configDir,
  };

  const opencodeCmd = process.env.OPENCODE_BIN || "opencode";

  const proc = spawn(opencodeCmd, ["web", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: workspace,
    env,
    detached: false,
  });

  proc.port = port;
  proc.userId = userId;

  proc.stdout.on("data", (d) => console.log(`[oc:${userId}]`, d.toString().trim()));
  proc.stderr.on("data", (d) => console.error(`[oc:${userId}:err]`, d.toString().trim()));

  proc.on("exit", (code) => {
    console.log(`[oc:${userId}] proceso terminado con código ${code}`);
    processes.delete(userId);
    db.setInstanceStatus(userId, "stopped").catch(() => {});
  });

  processes.set(userId, proc);
  await db.setInstanceStatus(userId, "running");

  await waitForPort(port, 30000);

  return port;
}

async function stopInstance(userId) {
  const proc = processes.get(userId);
  if (proc && !proc.killed) {
    proc.kill("SIGTERM");
    processes.delete(userId);
  }
  await db.setInstanceStatus(userId, "stopped");
}

function getInstancePort(userId) {
  const proc = processes.get(userId);
  if (proc && !proc.killed) return proc.port;
  return null;
}

function waitForPort(port, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const net = require("net");
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket
        .on("connect", () => { socket.destroy(); resolve(); })
        .on("error", () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) return reject(new Error(`Puerto ${port} no respondió`));
          setTimeout(check, 300);
        })
        .on("timeout", () => {
          socket.destroy();
          setTimeout(check, 300);
        })
        .connect(port, "127.0.0.1");
    };
    check();
  });
}

module.exports = { startInstance, stopInstance, getInstancePort, getUserWorkspace, setDb };
