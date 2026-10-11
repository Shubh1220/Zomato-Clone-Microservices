import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";

const STATUS_LABELS = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed by restaurant",
  PREPARING: "Preparing your food",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

export default function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function poll() {
      try {
        const data = await api.getOrder(id);
        if (cancelled) return;
        setOrder(data);
        if (data.status !== "DELIVERED") {
          timer = setTimeout(poll, 3000);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (error) return <p className="status error">Could not load order: {error}</p>;
  if (!order) return <p className="status">Loading order...</p>;

  const currentIndex = order.statusFlow.indexOf(order.status);

  return (
    <div className="page narrow">
      <h1>Order #{order.id}</h1>
      <p className="muted">{order.restaurant_name} · ₹{Number(order.total).toFixed(2)}</p>

      <div className="status-tracker">
        {order.statusFlow.map((status, i) => (
          <div key={status} className={`status-step ${i <= currentIndex ? "done" : ""}`}>
            <span className="status-dot" />
            <span>{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      {order.status !== "DELIVERED" && <p className="muted">Updating automatically...</p>}

      <div className="cart-list">
        {order.items.map((item) => (
          <div className="cart-row" key={item.id}>
            <span>{item.name} × {item.quantity}</span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <Link to="/my-orders">View all my orders</Link>
    </div>
  );
}
