const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

// Usar SQLite para desarrollo local
const dbPath = path.join(__dirname, "../../opencode.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("[db-sqlite] Error:", err);
  else console.log("[db-sqlite] Conectado a", dbPath);
});

// Promisify db.run y db.get
const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

async function init() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      username    TEXT UNIQUE NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at  DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS instances (
      user_id     INTEGER PRIMARY KEY,
      port        INTEGER UNIQUE NOT NULL,
      status      TEXT DEFAULT 'stopped',
      started_at  DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log("[db-sqlite] Tablas inicializadas");
}

async function createUser(email, username, password) {
  const hash = await bcrypt.hash(password, 12);
  const result = await dbRun(
    "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
    [email.toLowerCase(), username, hash]
  );
  return { id: result.lastID, email: email.toLowerCase(), username };
}

async function findUserByEmail(email) {
  return dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
}

async function findUserById(id) {
  return dbGet(
    "SELECT id, email, username, created_at FROM users WHERE id = ?",
    [id]
  );
}

async function createSession(userId) {
  const { v4: uuidv4 } = require("uuid");
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await dbRun(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    [id, userId, expiresAt.toISOString()]
  );
  return id;
}

async function getSession(sessionId) {
  return dbGet(
    `SELECT s.user_id, u.email, u.username
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
    [sessionId]
  );
}

async function deleteSession(sessionId) {
  await dbRun("DELETE FROM sessions WHERE id = ?", [sessionId]);
}

async function getOrAssignPort(userId) {
  const existing = await dbGet(
    "SELECT port FROM instances WHERE user_id = ?",
    [userId]
  );
  if (existing) return existing.port;

  const maxPort = await dbGet("SELECT MAX(port) as max FROM instances");
  const base = parseInt(process.env.OPENCODE_BASE_PORT || "5100");
  const port = (maxPort?.max || base - 1) + 1;

  await dbRun(
    "INSERT OR IGNORE INTO instances (user_id, port, status) VALUES (?, ?, 'stopped')",
    [userId, port]
  );
  return port;
}

async function setInstanceStatus(userId, status) {
  const startedAt = status === "running" ? new Date().toISOString() : null;
  await dbRun(
    "UPDATE instances SET status = ?, started_at = ? WHERE user_id = ?",
    [status, startedAt, userId]
  );
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  init,
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  getSession,
  deleteSession,
  getOrAssignPort,
  setInstanceStatus,
  verifyPassword,
};
