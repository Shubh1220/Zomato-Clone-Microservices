import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

export default function Checkout() {
  const { restaurant, items, total, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthenticated) return <Navigate to="/login?next=/checkout" replace />;
  if (!restaurant || items.length === 0) return <Navigate to="/" replace />;

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError(null);
    setPlacing(true);
    try {
      const order = await api.placeOrder(
        restaurant.id,
        items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        address
      );
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Checkout</h1>
      <p className="muted">Ordering from {restaurant.name}</p>

      <div className="cart-list">
        {items.map((item) => (
          <div className="cart-row" key={item.menuItemId}>
            <span>{item.name} × {item.quantity}</span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="cart-total">
        <span>Total</span>
        <span>₹{total.toFixed(2)}</span>
      </div>

      <form onSubmit={handlePlaceOrder} className="auth-form">
        <label>
          Delivery address
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            rows={3}
            placeholder="Flat / street / city / pincode"
          />
        </label>

        {error && <p className="status error">{error}</p>}

        <button className="primary-button" type="submit" disabled={placing}>
          {placing ? "Placing order..." : `Place order · ₹${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
