const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// SSL: si DATABASE_URL contiene sslmode=disable (EasyPanel interno), no usar SSL
// Si no hay DATABASE_URL, armar conexión desde variables individuales
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
    }
  : {
      host:     process.env.PGHOST     || "localhost",
      port:     parseInt(process.env.PGPORT || "5432"),
      user:     process.env.PGUSER     || "postgres",
      password: process.env.PGPASSWORD || "",
      database: process.env.PGDATABASE || "davey",
      ssl: false,
    };

const pool = new Pool(dbConfig);

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      username    TEXT UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      expires_at  TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS instances (
      user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      port        INTEGER UNIQUE NOT NULL,
      status      TEXT DEFAULT 'stopped',
      started_at  TIMESTAMPTZ
    );
  `);
  console.log("[db] Tablas inicializadas");
}

async function createUser(email, username, password) {
  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username",
    [email.toLowerCase(), username, hash]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query(
    "SELECT id, email, username, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

async function createSession(userId) {
  const { v4: uuidv4 } = require("uuid");
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [id, userId, expiresAt]
  );
  return id;
}

async function getSession(sessionId) {
  const result = await pool.query(
    `SELECT s.user_id, u.email, u.username
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId]
  );
  return result.rows[0] || null;
}

async function deleteSession(sessionId) {
  await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

async function getOrAssignPort(userId) {
  const existing = await pool.query(
    "SELECT port FROM instances WHERE user_id = $1",
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows[0].port;

  const maxPort = await pool.query("SELECT MAX(port) as max FROM instances");
  const base = parseInt(process.env.OPENCODE_BASE_PORT || "5100");
  const port = (maxPort.rows[0].max || base - 1) + 1;

  await pool.query(
    "INSERT INTO instances (user_id, port, status) VALUES ($1, $2, 'stopped') ON CONFLICT (user_id) DO NOTHING",
    [userId, port]
  );
  return port;
}

async function setInstanceStatus(userId, status) {
  await pool.query(
    "UPDATE instances SET status = $1, started_at = CASE WHEN $1 = 'running' THEN NOW() ELSE started_at END WHERE user_id = $2",
    [status, userId]
  );
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  pool,
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
