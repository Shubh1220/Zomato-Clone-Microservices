import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "product-service", database: "up" });
  } catch (err) {
    res.status(503).json({ status: "degraded", service: "product-service", database: "down", error: err.message });
  }
});

// List all restaurants
app.get("/api/restaurants", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM restaurants ORDER BY rating DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "could not load restaurants", detail: err.message });
  }
});

// One restaurant's details
app.get("/api/restaurants/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM restaurants WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "restaurant not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "could not load restaurant", detail: err.message });
  }
});

// A restaurant's menu
app.get("/api/restaurants/:id/menu", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM menu_items WHERE restaurant_id = ?", [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "could not load menu", detail: err.message });
  }
});

// Used internally by order-service to validate items and snapshot current prices
app.post("/api/menu-items/batch", async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required" });
  }
  try {
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await pool.query(`SELECT * FROM menu_items WHERE id IN (${placeholders})`, ids);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "could not load menu items", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`product-service listening on :${PORT}`);
});
