const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { createProxyMiddleware } = require("http-proxy-middleware");
const db = require("./db");

// Mapa de instancias activas: userId -> { port, proc, proxy }
const instances = new Map();

// Rutas por defecto dentro del proyecto (funcionan en Replit y en cualquier entorno)
// En EasyPanel se sobreescriben con las variables de entorno
const DEFAULT_WORKSPACE_ROOT = path.join(__dirname, "../../data/workspaces");
const DEFAULT_CONFIG_ROOT    = path.join(__dirname, "../../data/config");
const DEFAULT_DATA_ROOT      = path.join(__dirname, "../../data/appdata");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getUserWorkspace(userId) {
  const base = process.env.WORKSPACE_ROOT || DEFAULT_WORKSPACE_ROOT;
  return ensureDir(path.join(base, `user_${userId}`));
}

function getUserConfigDir(userId) {
  const base = process.env.CONFIG_ROOT || DEFAULT_CONFIG_ROOT;
  return ensureDir(path.join(base, `user_${userId}`));
}

function getUserDataDir(userId) {
  const base = process.env.DATA_ROOT || DEFAULT_DATA_ROOT;
  return ensureDir(path.join(base, `user_${userId}`));
}

function waitForPort(port, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket
        .on("connect", () => { socket.destroy(); resolve(); })
        .on("error", () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs)
            return reject(new Error(`Puerto ${port} no respondió en ${timeoutMs}ms`));
          setTimeout(check, 400);
        })
        .on("timeout", () => { socket.destroy(); setTimeout(check, 400); })
        .connect(port, "127.0.0.1");
    };
    check();
  });
}

// Crea el proxy persistente para un usuario (reutilizable, soporta WebSockets)
function createUserProxy(port) {
  return createProxyMiddleware({
    target: `http://127.0.0.1:${port}`,
    changeOrigin: true,
    ws: true,
    pathRewrite: { "^/app/oc": "" },
    on: {
      error: (err, req, res) => {
        console.error("[proxy]", err.message);
        if (res && !res.headersSent) {
          res.status(502).send("OpenCode iniciando... recarga en unos segundos.");
        }
      },
    },
  });
}

// Inicia la instancia de un usuario (o devuelve la existente)
async function startInstance(userId) {
  // Si ya existe y el proceso sigue vivo, devuelve directo
  if (instances.has(userId)) {
    const inst = instances.get(userId);
    if (inst.proc && !inst.proc.killed) {
      return inst;
    }
    // El proceso murió — limpiar
    instances.delete(userId);
  }

  const port = await db.getOrAssignPort(userId);
  const workspace = getUserWorkspace(userId);
  const configDir = getUserConfigDir(userId);
  const dataDir = getUserDataDir(userId);

  // En producción (EasyPanel) HOME=/home/opencode existe dentro del contenedor.
  // En Replit usamos el HOME real del proceso para no romper la instalación.
  const isProduction = process.env.NODE_ENV === "production";
  const homeDir = isProduction ? "/home/opencode" : (process.env.HOME || require("os").homedir());

  const env = {
    ...process.env,
    HOME: homeDir,
    XDG_CONFIG_HOME: configDir,
    XDG_DATA_HOME: dataDir,
    OPENCODE_CONFIG_DIR: configDir,
  };

  // Buscar el binario: variable de entorno > PATH completo
  const opencodeCmd = process.env.OPENCODE_BIN ||
    require("child_process").execSync("which opencode 2>/dev/null || echo opencode")
      .toString().trim();

  console.log(`[oc:${userId}] Iniciando en puerto ${port}...`);

  const proc = spawn(opencodeCmd, ["web", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: workspace,
    env,
    detached: false,
  });

  proc.stdout.on("data", (d) => console.log(`[oc:${userId}]`, d.toString().trim()));
  proc.stderr.on("data", (d) => console.error(`[oc:${userId}:err]`, d.toString().trim()));

  proc.on("exit", (code) => {
    console.log(`[oc:${userId}] proceso terminado (código ${code})`);
    instances.delete(userId);
    db.setInstanceStatus(userId, "stopped").catch(() => {});
  });

  // Esperar a que OpenCode esté listo
  await waitForPort(port, 30000);

  // Crear proxy persistente (se reutiliza en cada request y soporta WS)
  const proxy = createUserProxy(port);

  const inst = { port, proc, proxy };
  instances.set(userId, inst);
  await db.setInstanceStatus(userId, "running");

  console.log(`[oc:${userId}] Listo en puerto ${port}`);
  return inst;
}

async function stopInstance(userId) {
  const inst = instances.get(userId);
  if (inst && inst.proc && !inst.proc.killed) {
    inst.proc.kill("SIGTERM");
    instances.delete(userId);
  }
  await db.setInstanceStatus(userId, "stopped");
}

function getInstance(userId) {
  const inst = instances.get(userId);
  if (inst && inst.proc && !inst.proc.killed) return inst;
  return null;
}

function getUserWorkspaceExport(userId) {
  return getUserWorkspace(userId);
}

module.exports = { startInstance, stopInstance, getInstance, getUserWorkspace: getUserWorkspaceExport };
