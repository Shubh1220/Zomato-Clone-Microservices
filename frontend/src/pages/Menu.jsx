import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useCart } from "../context/CartContext.jsx";

export default function Menu() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem, restaurant: cartRestaurant, items } = useCart();

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getRestaurant(id), api.getMenu(id)])
      .then(([r, m]) => {
        setRestaurant(r);
        setMenu(m);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="status">Loading menu...</p>;
  if (error) return <p className="status error">Could not load menu: {error}</p>;

  const quantityFor = (menuItemId) => items.find((i) => i.menuItemId === menuItemId)?.quantity || 0;
  const switchingRestaurant = cartRestaurant && cartRestaurant.id !== Number(id) && items.length > 0;

  return (
    <div className="page">
      <h1>{restaurant.name}</h1>
      <p className="muted">{restaurant.cuisine} · ★ {restaurant.rating} · {restaurant.delivery_time_mins} mins</p>

      {switchingRestaurant && (
        <p className="notice-inline">
          Adding an item here will replace your current cart from {cartRestaurant.name}.
        </p>
      )}

      <div className="menu-list">
        {menu.map((item) => (
          <div className="menu-item" key={item.id}>
            <div>
              <span className={`veg-dot ${item.is_veg ? "veg" : "non-veg"}`} />
              <strong>{item.name}</strong>
              <p className="muted">{item.description}</p>
              <p>₹{Number(item.price).toFixed(2)}</p>
            </div>
            <button
              onClick={() => addItem({ id: restaurant.id, name: restaurant.name }, item)}
            >
              {quantityFor(item.id) > 0 ? `Add more (${quantityFor(item.id)} in cart)` : "Add to cart"}
            </button>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <Link to="/cart" className="floating-cart-link">
          View cart ({items.reduce((s, i) => s + i.quantity, 0)} items)
        </Link>
      )}
    </div>
  );
}
