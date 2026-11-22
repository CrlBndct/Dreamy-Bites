
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

export const STATUSES = [
  'Pending',
  'Preparing',
  'Ready',
  'Completed',
];

const OrdersContext = createContext();

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api('/api/orders');
      setOrders(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createOrder = async (orderData) => {
    const result = await api('/api/orders', {
      method: 'POST',
      body: orderData,
    });

    await load();
    return result;
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api(`/api/orders/${id}`, {
        method: 'PATCH',
        body: { status },
      });

      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteOrder = async (id) => {
    try {
      await api(`/api/orders/${id}`, {
        method: 'DELETE',
      });

      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        loading,
        error,
        refresh: load,
        createOrder,
        updateOrderStatus,
        deleteOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => useContext(OrdersContext);
