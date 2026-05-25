require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const db = require("./db");
const instances = require("./instances");

const app = express();
const PORT = process.env.PORT || 4096;

// ⚠️  Los parsers de body SOLO en /api/* — si se aplican globalmente
//    consumen el stream antes de que el proxy lo reenvíe a OpenCode.
const jsonParser = express.json();
const urlencodedParser = express.urlencoded({ extended: true });
app.use(cookieParser());

// ── Helper: obtener sesión ────────────────────────────────
async function getSession(req) {
  const sessionId = req.cookies?.session;
  if (!sessionId) return null;
  return db.getSession(sessionId);
}

// ── Páginas públicas ──────────────────────────────────────
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

// ── API de autenticación ──────────────────────────────────
app.post("/api/register", jsonParser, urlencodedParser, async (req, res) => {
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
    res.json({ ok: true, redirect: "/" });
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "El email o usuario ya existe" });
    console.error("[register]", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/api/login", jsonParser, urlencodedParser, async (req, res) => {
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
    res.json({ ok: true, redirect: "/" });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ── Pantalla de carga ─────────────────────────────────────
app.get("/_loading", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/loading.html")));

// ── Proxy universal — TODAS las rutas van a OpenCode ─────
// Las rutas de auth ya están capturadas arriba; esta captura el resto.
// OpenCode sirve su frontend con rutas absolutas (/assets/..., /favicon.ico, etc.)
// Por eso proxeamos desde "/" para que todo llegue correcto.
app.use("/", async (req, res, next) => {
  const session = await getSession(req).catch(() => null);

  // Sin sesión → login
  if (!session) return res.redirect("/login");

  // Obtener o arrancar la instancia del usuario
  let inst = instances.getInstance(session.user_id);
  if (!inst) {
    // Mientras arranca, mostrar pantalla de carga
    if (req.path === "/" || req.headers.accept?.includes("text/html")) {
      return res.sendFile(path.join(__dirname, "../public/loading.html"));
    }
    // Petición de assets mientras arranca → iniciar en background y responder 503
    instances.startInstance(session.user_id).catch(() => {});
    return res.status(503).set("Retry-After", "3").end();
  }

  // Proxy a la instancia OpenCode del usuario
  inst.proxy(req, res, next);
});

// ── Inicio del servidor ───────────────────────────────────
async function main() {
  await db.init();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[opencode-platform] ✅ Servidor en http://0.0.0.0:${PORT}`);
  });

  // WebSocket upgrades para OpenCode (terminal, live updates)
  server.on("upgrade", async (req, socket, head) => {
    const cookieHeader = req.headers.cookie || "";
    const sessionId = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("session="))
      ?.split("=")[1];

    if (!sessionId) return socket.destroy();
    const session = await db.getSession(sessionId).catch(() => null);
    if (!session) return socket.destroy();

    let inst = instances.getInstance(session.user_id);
    if (!inst) inst = await instances.startInstance(session.user_id).catch(() => null);
    if (!inst) return socket.destroy();

    inst.proxy.upgrade(req, socket, head);
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
