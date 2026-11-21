import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useProducts } from '../ProductsContext';
import { useOrders, STATUSES } from '../OrdersContext';
import '../styles/baker.css';

const EMPTY = { foodName: '', foodDes: '', price: '', category: 'Pastry', pic: '' };

export default function BakerPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { orders, updateStatus, deleteOrder } = useOrders();

  const [tab, setTab] = useState('orders');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const activeCount = orders.filter((o) => o.status !== 'Completed').length;
  const revenue = orders
    .filter((o) => o.status === 'Completed')
    .reduce((sum, o) => sum + o.total, 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, price: Number(form.price) };

    if (editingId) {
      updateProduct(editingId, data);
    } else {
      addProduct(data);
    }

    setForm(EMPTY);
    setEditingId(null);
  };

  const startEdit = (p) => {
    setEditingId(p.foodId);
    setForm({
      foodName: p.foodName,
      foodDes: p.foodDes,
      price: p.price,
      category: p.category,
      pic: p.pic,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleDelete = (p) => {
    if (window.confirm(`Delete ${p.foodName}?`)) {
      deleteProduct(p.foodId);
      if (editingId === p.foodId) cancelEdit();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className="baker-nav">
        <h1>
          Dreamy Bites <small>Baker Dashboard</small>
        </h1>
        <div>
          <span className="baker-user">{user?.email}</span>
          <button onClick={() => navigate('/homepage')}>View Shop</button>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div className="baker-page">
        <div className="stats">
          <div className="stat"><h2>{activeCount}</h2><p>Active orders</p></div>
          <div className="stat"><h2>{products.length}</h2><p>Products</p></div>
          <div className="stat"><h2>Php {revenue}</h2><p>Completed sales</p></div>
        </div>

        <div className="tabs">
          <button
            className={tab === 'orders' ? 'tab active' : 'tab'}
            onClick={() => setTab('orders')}
          >
            Orders
          </button>
          <button
            className={tab === 'products' ? 'tab active' : 'tab'}
            onClick={() => setTab('products')}
          >
            Products
          </button>
        </div>

        {/* ---------- ORDERS ---------- */}
        {tab === 'orders' && (
          <>
            {orders.length === 0 && <p>No orders yet.</p>}

            {orders.map((o) => (
              <div className="order-card" key={o.id}>
                <div className="order-head">
                  <strong>Order #{String(o.id).slice(-5)}</strong>
                  <span>{o.date}</span>
                </div>

                <p className="order-customer">{o.customer}</p>

                <ul>
                  {o.items.map((i, idx) => (
                    <li key={idx}>
                      {i.qty} × {i.name} (Php {i.price * i.qty})
                    </li>
                  ))}
                </ul>

                <div className="order-foot">
                  <strong>Total: Php {o.total}</strong>
                  <div>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button className="danger" onClick={() => deleteOrder(o.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ---------- PRODUCTS ---------- */}
        {tab === 'products' && (
          <>
            <form className="product-form" onSubmit={handleSubmit}>
              <h2>{editingId ? 'Edit product' : 'Add a product'}</h2>

              <input name="foodName" placeholder="Name"
                value={form.foodName} onChange={handleChange} required />
              <input name="foodDes" placeholder="Description"
                value={form.foodDes} onChange={handleChange} required />
              <input name="price" type="number" min="1" placeholder="Price (Php)"
                value={form.price} onChange={handleChange} required />

              <select name="category" value={form.category} onChange={handleChange}>
                <option value="Pastry">Pastry</option>
                <option value="Beverage">Beverage</option>
              </select>

              <input name="pic" placeholder="Image path (e.g. /Brownie.jpg)"
                value={form.pic} onChange={handleChange} required />

              <div>
                <button type="submit" className="primary">
                  {editingId ? 'Save changes' : 'Add product'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit}>Cancel</button>
                )}
              </div>
            </form>

            {products.map((p) => (
              <div className="product-row" key={p.foodId}>
                <img src={p.pic} alt={p.foodName} />

                <div className="product-info">
                  <h3>{p.foodName}</h3>
                  <p>{p.category} · Php {p.price}</p>
                  {p.available === false && <span className="badge">Sold out</span>}
                </div>

                <div className="product-actions">
                  <button
                    onClick={() => updateProduct(p.foodId, { available: p.available === false })}
                  >
                    {p.available === false ? 'Mark available' : 'Mark sold out'}
                  </button>
                  <button onClick={() => startEdit(p)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(p)}>Delete</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}