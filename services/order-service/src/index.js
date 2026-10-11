import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4003;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";

// Order lifecycle a real order progresses through. Demo mode advances a new
// order through these automatically (see scheduleProgression) so the Order
// Status page has something real to poll, without needing an actual courier.
const STATUS_FLOW = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
const STAGE_INTERVAL_MS = Number(process.env.STAGE_INTERVAL_MS || 8000);

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "order-service", database: "up" });
  } catch (err) {
    res.status(503).json({ status: "degraded", service: "order-service", database: "down", error: err.message });
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

function scheduleProgression(orderId, stageIndex = 0) {
  if (stageIndex >= STATUS_FLOW.length - 1) return;
  setTimeout(async () => {
    const nextStatus = STATUS_FLOW[stageIndex + 1];
    try {
      await pool.query("UPDATE orders SET status = ? WHERE id = ?", [nextStatus, orderId]);
    } catch (err) {
      console.error(`failed to advance order ${orderId} to ${nextStatus}:`, err.message);
      return;
    }
    scheduleProgression(orderId, stageIndex + 1);
  }, STAGE_INTERVAL_MS);
}

// Checkout: validates the cart against product-service (authoritative prices,
// not whatever the client sent), creates the order, and starts status progression.
app.post("/api/orders", authenticate, async (req, res) => {
  const { restaurantId, items, deliveryAddress } = req.body || {};
  if (!restaurantId || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
    return res.status(400).json({ error: "restaurantId, items, and deliveryAddress are required" });
  }

  try {
    const restaurantRes = await fetch(`${PRODUCT_SERVICE_URL}/api/restaurants/${restaurantId}`);
    if (!restaurantRes.ok) return res.status(400).json({ error: "restaurant not found" });
    const restaurant = await restaurantRes.json();

    const menuRes = await fetch(`${PRODUCT_SERVICE_URL}/api/menu-items/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: items.map((i) => i.menuItemId) }),
    });
    if (!menuRes.ok) return res.status(400).json({ error: "could not validate menu items" });
    const menuItems = await menuRes.json();
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const menuItem = menuById.get(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ error: `menu item ${item.menuItemId} not found` });
      }
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const lineTotal = Number(menuItem.price) * quantity;
      total += lineTotal;
      orderItems.push({ menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, restaurant_id, restaurant_name, status, total, delivery_address)
         VALUES (?, ?, ?, 'PLACED', ?, ?)`,
        [req.auth.userId, restaurantId, restaurant.name, total.toFixed(2), deliveryAddress]
      );
      const orderId = orderResult.insertId;

      for (const item of orderItems) {
        await conn.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.menuItemId, item.name, item.price, item.quantity]
        );
      }

      await conn.commit();
      scheduleProgression(orderId);

      res.status(201).json({
        id: orderId,
        restaurantName: restaurant.name,
        status: "PLACED",
        total: total.toFixed(2),
        items: orderItems,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: "checkout failed", detail: err.message });
  }
});

// Order Status page: one order's current status + items, owner-only.
app.get("/api/orders/:id", authenticate, async (req, res) => {
  try {
    const [orderRows] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: "order not found" });
    if (order.user_id !== req.auth.userId) return res.status(403).json({ error: "not your order" });

    const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
    res.json({ ...order, items, statusFlow: STATUS_FLOW });
  } catch (err) {
    res.status(500).json({ error: "could not load order", detail: err.message });
  }
});

// My Orders page: every order the logged-in user has placed, newest first.
app.get("/api/orders", authenticate, async (req, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.auth.userId]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "could not load orders", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`order-service listening on :${PORT}`);
});
