import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const PORT = process.env.PORT || 4001;

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "user-service", database: "up" });
  } catch (err) {
    res.status(503).json({ status: "degraded", service: "user-service", database: "down", error: err.message });
  }
});

app.post("/api/users/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "an account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );

    const token = jwt.sign({ userId: result.insertId, email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: result.insertId, name, email } });
  } catch (err) {
    res.status(500).json({ error: "registration failed", detail: err.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "login failed", detail: err.message });
  }
});

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing authorization token" });

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired token" });
  }
}

app.get("/api/users/me", authenticate, async (req, res) => {
  const [rows] = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = ?", [req.auth.userId]);
  if (rows.length === 0) return res.status(404).json({ error: "user not found" });
  res.json(rows[0]);
});

// Used internally by other services to verify a token without duplicating JWT_SECRET handling in every service.
app.post("/api/users/verify", (req, res) => {
  const { token } = req.body || {};
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, userId: payload.userId, email: payload.email });
  } catch {
    res.status(401).json({ valid: false });
  }
});

app.listen(PORT, () => {
  console.log(`user-service listening on :${PORT}`);
});
