import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getRestaurants()
      .then(setRestaurants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status">Loading restaurants...</p>;
  if (error) return <p className="status error">Could not load restaurants: {error}</p>;

  return (
    <div className="page">
      <h1>Restaurants near you</h1>
      <div className="restaurant-grid">
        {restaurants.map((r) => (
          <Link to={`/restaurants/${r.id}`} key={r.id} className="restaurant-card">
            <div className="restaurant-banner" style={{ background: r.image_color }}>
              {r.name[0]}
            </div>
            <div className="restaurant-info">
              <h3>{r.name}</h3>
              <p>{r.cuisine}</p>
              <div className="restaurant-meta">
                <span>★ {r.rating}</span>
                <span>{r.delivery_time_mins} mins</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
