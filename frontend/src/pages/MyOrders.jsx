import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MyOrders() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login?next=/my-orders" replace />;
  if (loading) return <p className="status">Loading your orders...</p>;
  if (error) return <p className="status error">Could not load orders: {error}</p>;
  if (orders.length === 0) {
    return (
      <div className="page">
        <h1>My Orders</h1>
        <p>You haven't placed any orders yet.</p>
        <Link to="/">Browse restaurants</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>My Orders</h1>
      <div className="order-list">
        {orders.map((order) => (
          <Link to={`/orders/${order.id}`} key={order.id} className="order-row">
            <div>
              <strong>{order.restaurant_name}</strong>
              <p className="muted">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="order-row-right">
              <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status.replace(/_/g, " ")}</span>
              <span>₹{Number(order.total).toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
