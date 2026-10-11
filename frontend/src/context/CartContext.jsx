import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [restaurant, setRestaurant] = useState(null); // { id, name }
  const [items, setItems] = useState([]); // [{ menuItemId, name, price, quantity }]

  const addItem = useCallback((restaurantInfo, menuItem) => {
    setRestaurant((currentRestaurant) => {
      // Switching restaurants clears the cart — matches how real food-delivery
      // apps work, since one order can only come from one restaurant.
      if (currentRestaurant && currentRestaurant.id !== restaurantInfo.id) {
        setItems([{ menuItemId: menuItem.id, name: menuItem.name, price: Number(menuItem.price), quantity: 1 }]);
        return restaurantInfo;
      }
      setItems((prev) => {
        const existing = prev.find((i) => i.menuItemId === menuItem.id);
        if (existing) {
          return prev.map((i) => (i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [...prev, { menuItemId: menuItem.id, name: menuItem.name, price: Number(menuItem.price), quantity: 1 }];
      });
      return restaurantInfo;
    });
  }, []);

  const updateQuantity = useCallback((menuItemId, delta) => {
    setItems((prev) =>
      prev
        .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurant(null);
  }, []);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ restaurant, items, addItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
