import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useProducts } from '../ProductsContext';
import { useOrders, STATUSES } from '../OrdersContext';
import BranchesManager from './BranchesManager';
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

  /* ---------- sales calculations ---------- */
  const completed = orders.filter((o) => o.status === 'Completed');
  const activeCount = orders.length - completed.length;
  const revenue = completed.reduce((sum, o) => sum + o.total, 0);
  const avgOrder = completed.length ? Math.round(revenue / completed.length) : 0;

  const todayStr = new Date().toDateString();
  const todaySales = completed
    .filter((o) => new Date(o.id).toDateString() === todayStr)
    .reduce((sum, o) => sum + o.total, 0);

  const last7 = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const total = completed
      .filter((o) => new Date(o.id).toDateString() === d.toDateString())
      .reduce((sum, o) => sum + o.total, 0);
    return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), total };
  });
  const maxDay = Math.max(...last7.map((d) => d.total), 1);

  const byProduct = {};
  completed.forEach((o) =>
    o.items.forEach((i) => {
      if (!byProduct[i.name]) byProduct[i.name] = { name: i.name, qty: 0, total: 0 };
      byProduct[i.name].qty += i.qty;
      byProduct[i.name].total += i.qty * i.price;
    })
  );
  const bestSellers = Object.values(byProduct).sort((a, b) => b.total - a.total);

  /* ---------- product form ---------- */
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
          <button className={tab === 'orders' ? 'tab active' : 'tab'} onClick={() => setTab('orders')}>
            Orders
          </button>
          <button className={tab === 'sales' ? 'tab active' : 'tab'} onClick={() => setTab('sales')}>
            Sales
          </button>
          <button className={tab === 'products' ? 'tab active' : 'tab'} onClick={() => setTab('products')}>
            Products
          </button>
          <button className={tab === 'branches' ? 'tab active' : 'tab'} onClick={() => setTab('branches')}>
            Branches
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
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button className="danger" onClick={() => deleteOrder(o.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ---------- SALES ---------- */}
        {tab === 'sales' && (
          <>
            <div className="stats">
              <div className="stat"><h2>Php {revenue}</h2><p>Total sales</p></div>
              <div className="stat"><h2>Php {todaySales}</h2><p>Today</p></div>
              <div className="stat"><h2>{completed.length}</h2><p>Completed orders</p></div>
              <div className="stat"><h2>Php {avgOrder}</h2><p>Average order</p></div>
            </div>

            <div className="panel">
              <h2>Last 7 days</h2>
              <div className="chart">
                {last7.map((d, idx) => (
                  <div className="bar-col" key={idx}>
                    <span className="bar-value">{d.total > 0 ? d.total : ''}</span>
                    <div className="bar" style={{ height: `${(d.total / maxDay) * 100}%` }} />
                    <span className="bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Best sellers</h2>
              {bestSellers.length === 0 ? (
                <p>No completed orders yet. Mark an order as Completed to see sales here.</p>
              ) : (
                <table className="sales-table">
                  <thead>
                    <tr><th>Product</th><th>Sold</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {bestSellers.map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td>{p.qty}</td>
                        <td>Php {p.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
                {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
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
                  <button onClick={() => updateProduct(p.foodId, { available: p.available === false })}>
                    {p.available === false ? 'Mark available' : 'Mark sold out'}
                  </button>
                  <button onClick={() => startEdit(p)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(p)}>Delete</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ---------- BRANCHES ---------- */}
        {tab === 'branches' && <BranchesManager />}
      </div>
    </>
  );
}