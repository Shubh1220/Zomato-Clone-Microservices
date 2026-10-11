import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">TastyGo</Link>
      <div className="nav-links">
        <Link to="/cart">Cart{itemCount > 0 ? ` (${itemCount})` : ""}</Link>
        {isAuthenticated ? (
          <>
            <Link to="/my-orders">My Orders</Link>
            <span className="nav-user">Hi, {user.name.split(" ")[0]}</span>
            <button
              className="link-button"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link to="/login">Log in</Link>
        )}
      </div>
    </nav>
  );
}
