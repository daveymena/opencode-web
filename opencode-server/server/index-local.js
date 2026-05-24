require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cookieParser = require("cookie-parser");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const db = require("./db-sqlite");
const instances = require("./instances");

const app = express();
const PORT = process.env.PORT || 4096;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

async function requireAuth(req, res, next) {
  const sessionId = req.cookies?.session;
  if (!sessionId) return res.redirect("/login");
  const session = await db.getSession(sessionId);
  if (!session) return res.redirect("/login");
  req.user = session;
  next();
}

// ── Páginas estáticas ──────────────────────────────────────
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

app.get("/logout", async (req, res) => {
  const sessionId = req.cookies?.session;
  if (sessionId) await db.deleteSession(sessionId);
  res.clearCookie("session");
  res.redirect("/login");
});

// ── API de autenticación ───────────────────────────────────
app.post("/api/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    if (password.length < 8)
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });

    const user = await db.createUser(email, username, password);
    const sessionId = await db.createSession(user.id);
    res.cookie("session", sessionId, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true, redirect: "/app" });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(409).json({ error: "El email o usuario ya existe" });
    console.error("[register]", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email y contraseña requeridos" });

    const user = await db.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

    const valid = await db.verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Credenciales incorrectas" });

    const sessionId = await db.createSession(user.id);
    res.cookie("session", sessionId, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true, redirect: "/app" });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ── Dashboard de inicio (redirección a OpenCode) ──────────
app.get("/app", requireAuth, async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/loading.html"));
});

// ── Proxy a la instancia OpenCode del usuario ─────────────
app.use("/app/oc", requireAuth, async (req, res, next) => {
  try {
    let port = instances.getInstancePort(req.user.user_id);
    if (!port) {
      port = await instances.startInstance(req.user.user_id);
    }
    const proxy = createProxyMiddleware({
      target: `http://127.0.0.1:${port}`,
      changeOrigin: true,
      ws: true,
      pathRewrite: { "^/app/oc": "" },
      on: {
        error: (err, req, res) => {
          console.error("[proxy]", err.message);
          res.status(502).send("OpenCode iniciando... recarga en unos segundos.");
        },
      },
    });
    proxy(req, res, next);
  } catch (err) {
    console.error("[proxy setup]", err);
    res.status(500).send("Error al iniciar tu instancia de OpenCode");
  }
});

// ── Raíz: redirige al login o al app ──────────────────────
app.get("/", async (req, res) => {
  const sessionId = req.cookies?.session;
  if (!sessionId) return res.redirect("/login");
  const session = await db.getSession(sessionId);
  if (!session) return res.redirect("/login");
  res.redirect("/app");
});

// ── Inicio ─────────────────────────────────────────────────
async function main() {
  await db.init();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[opencode-platform] Servidor en http://localhost:${PORT}`);
    console.log(`[opencode-platform] Usando SQLite (desarrollo local)`);
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
