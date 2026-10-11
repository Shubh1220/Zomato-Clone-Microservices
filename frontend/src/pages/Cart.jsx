import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Cart() {
  const { restaurant, items, updateQuantity, total } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!restaurant || items.length === 0) {
    return (
      <div className="page">
        <h1>Your cart is empty</h1>
        <Link to="/">Browse restaurants</Link>
      </div>
    );
  }

  function handleCheckoutClick() {
    if (!isAuthenticated) {
      navigate("/login?next=/checkout");
      return;
    }
    navigate("/checkout");
  }

  return (
    <div className="page">
      <h1>Your cart</h1>
      <p className="muted">From {restaurant.name}</p>

      <div className="cart-list">
        {items.map((item) => (
          <div className="cart-row" key={item.menuItemId}>
            <span>{item.name}</span>
            <div className="qty-control">
              <button onClick={() => updateQuantity(item.menuItemId, -1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.menuItemId, 1)}>+</button>
            </div>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="cart-total">
        <span>Total</span>
        <span>₹{total.toFixed(2)}</span>
      </div>

      <button className="primary-button" onClick={handleCheckoutClick}>
        Proceed to checkout
      </button>
    </div>
  );
}
