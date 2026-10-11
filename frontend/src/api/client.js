const BASE = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  register: (name, email, password) =>
    request("/users/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email, password) =>
    request("/users/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/users/me"),

  getRestaurants: () => request("/restaurants"),
  getRestaurant: (id) => request(`/restaurants/${id}`),
  getMenu: (restaurantId) => request(`/restaurants/${restaurantId}/menu`),

  placeOrder: (restaurantId, items, deliveryAddress) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify({ restaurantId, items, deliveryAddress }),
    }),
  getOrder: (id) => request(`/orders/${id}`),
  getMyOrders: () => request("/orders"),
};
