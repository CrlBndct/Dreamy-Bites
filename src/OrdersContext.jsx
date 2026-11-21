import { createContext, useContext, useState, useEffect } from 'react';

const OrdersContext = createContext();
const KEY = 'dreamybites-orders';

export const STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed'];

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(orders)); } catch {}
  }, [orders]);

  const placeOrder = ({ customer, items, total }) =>
    setOrders((prev) => [
      {
        id: Date.now(),
        customer,
        items: items.map((i) => ({ name: i.foodName, qty: i.quantity, price: i.price })),
        total,
        status: 'Pending',
        date: new Date().toLocaleString(),
      },
      ...prev,
    ]);

  const updateStatus = (id, status) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  const deleteOrder = (id) => setOrders((prev) => prev.filter((o) => o.id !== id));

  return (
    <OrdersContext.Provider value={{ orders, placeOrder, updateStatus, deleteOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => useContext(OrdersContext);