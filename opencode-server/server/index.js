require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const db = require("./db");
const instances = require("./instances");

const app = express();
const PORT = process.env.PORT || 4096;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Autenticación ──────────────────────────────────────────
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

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/login.html")));

app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/register.html")));

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
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true, redirect: "/app" });
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "El email o usuario ya existe" });
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
    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true, redirect: "/app" });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ── Pantalla de carga del app ──────────────────────────────
app.get("/app", requireAuth, (req, res) =>
  res.sendFile(path.join(__dirname, "../public/loading.html")));

// ── Proxy a la instancia OpenCode del usuario ─────────────
// El proxy es PERSISTENTE por usuario — soporta WebSockets correctamente
app.use("/app/oc", requireAuth, async (req, res, next) => {
  try {
    let inst = instances.getInstance(req.user.user_id);
    if (!inst) {
      inst = await instances.startInstance(req.user.user_id);
    }
    // Reutiliza el mismo proxy (conexiones WS se mantienen)
    inst.proxy(req, res, next);
  } catch (err) {
    console.error("[proxy setup]", err.message);
    if (!res.headersSent) {
      res.status(500).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px">
          <h2>⚠️ Error al iniciar OpenCode</h2>
          <p>${err.message}</p>
          <a href="/app">← Reintentar</a>
        </body></html>
      `);
    }
  }
});

// ── Raíz: redirige según sesión ────────────────────────────
app.get("/", async (req, res) => {
  const sessionId = req.cookies?.session;
  if (!sessionId) return res.redirect("/login");
  const session = await db.getSession(sessionId);
  if (!session) return res.redirect("/login");
  res.redirect("/app");
});

// ── Inicio del servidor ────────────────────────────────────
async function main() {
  await db.init();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[opencode-platform] ✅ Servidor en http://0.0.0.0:${PORT}`);
  });

  // Soporte para WebSocket upgrades (necesario para OpenCode)
  server.on("upgrade", async (req, socket, head) => {
    // Extraer cookie de sesión del header
    const cookieHeader = req.headers.cookie || "";
    const sessionId = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("session="))
      ?.split("=")[1];

    if (!sessionId) { socket.destroy(); return; }

    const session = await db.getSession(sessionId).catch(() => null);
    if (!session) { socket.destroy(); return; }

    let inst = instances.getInstance(session.user_id);
    if (!inst) {
      inst = await instances.startInstance(session.user_id).catch(() => null);
    }
    if (!inst) { socket.destroy(); return; }

    // Delegar el upgrade al proxy del usuario
    inst.proxy.upgrade(req, socket, head);
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
