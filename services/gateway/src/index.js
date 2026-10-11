import "dotenv/config";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:4001";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:4002";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:4003";

app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));

// Route by path prefix to the owning microservice. This is the single
// address the frontend talks to — it never calls the backend services directly.
// Express strips the mount prefix before the proxy sees the request, so
// pathRewrite puts it back on before forwarding downstream.
function proxyFor(target, prefix) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => prefix + path,
  });
}

app.use("/api/users", proxyFor(USER_SERVICE_URL, "/api/users"));
app.use("/api/restaurants", proxyFor(PRODUCT_SERVICE_URL, "/api/restaurants"));
app.use("/api/menu-items", proxyFor(PRODUCT_SERVICE_URL, "/api/menu-items"));
app.use("/api/orders", proxyFor(ORDER_SERVICE_URL, "/api/orders"));

app.listen(PORT, () => {
  console.log(`gateway listening on :${PORT}`);
  console.log(`  -> user-service:    ${USER_SERVICE_URL}`);
  console.log(`  -> product-service: ${PRODUCT_SERVICE_URL}`);
  console.log(`  -> order-service:   ${ORDER_SERVICE_URL}`);
});
