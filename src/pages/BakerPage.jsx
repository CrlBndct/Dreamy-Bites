
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useProducts } from '../ProductsContext';
import { useOrders, STATUSES } from '../OrdersContext';
import { imageUrl } from '../imageUrl';
import BranchesManager from './BranchesManager';
import '../styles/baker.css';
import '../styles/cart.css';

const EMPTY = {
  foodName: '',
  foodDes: '',
  price: '',
  category: 'Pastry',
  pic: '',
};

const TYPE_FILTERS = ['All', 'Pickup', 'Delivery', 'Dine-in'];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function BakerPage() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();

  const {
    orders,
    loading,
    error,
    updateOrderStatus,
    deleteOrder,
  } = useOrders();

  const [tab, setTab] = useState('orders');
  const [typeFilter, setTypeFilter] = useState('All');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [imageError, setImageError] = useState('');

  /* ---------- SALES CALCULATIONS ---------- */

  const shownOrders = orders.filter(
    (o) => typeFilter === 'All' || o.type === typeFilter
  );

  const completed = orders.filter((o) => o.status === 'Completed');

  const activeCount = orders.filter(
    (o) => o.status !== 'Completed'
  ).length;

  const revenue = completed.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  const avgOrder = completed.length
    ? Math.round(revenue / completed.length)
    : 0;

  const todayStr = new Date().toDateString();

  const todaySales = completed
    .filter((o) => new Date(o.createdAt).toDateString() === todayStr)
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const last7 = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();

    d.setDate(d.getDate() - (6 - idx));

    const total = completed
      .filter(
        (o) => new Date(o.createdAt).toDateString() === d.toDateString()
      )
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return {
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      total,
    };
  });

  const maxDay = Math.max(...last7.map((d) => d.total), 1);

  const byProduct = {};

  completed.forEach((o) =>
    o.items.forEach((i) => {
      if (!byProduct[i.name]) {
        byProduct[i.name] = {
          name: i.name,
          qty: 0,
          total: 0,
        };
      }

      byProduct[i.name].qty += Number(i.qty || 0);
      byProduct[i.name].total +=
        Number(i.qty || 0) * Number(i.price || 0);
    })
  );

  const bestSellers = Object.values(byProduct).sort(
    (a, b) => b.total - a.total
  );

  /* ---------- PRODUCT FORM ---------- */

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageError('');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPG, PNG, and WEBP images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image must not exceed 5 MB.');
      e.target.value = '';
      return;
    }

    if (preview && selectedFile) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    if (preview && selectedFile) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(null);
    setPreview('');
    setImageError('');
  };

  const resetForm = () => {
    clearSelectedImage();
    setForm(EMPTY);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setImageError('');

    if (!editingId && !selectedFile) {
      setImageError('Please select an image for the product.');
      return;
    }

    const data = {
      ...form,
      price: Number(form.price),
    };

    try {
      if (selectedFile) {
        const formData = new FormData();

        formData.append('foodName', data.foodName);
        formData.append('foodDes', data.foodDes);
        formData.append('price', String(data.price));
        formData.append('category', data.category);
        formData.append('image', selectedFile);

        if (editingId) {
          await updateProduct(editingId, formData);
        } else {
          await addProduct(formData);
        }
      } else {
        if (editingId) {
          await updateProduct(editingId, data);
        } else {
          await addProduct(data);
        }
      }

      resetForm();
    } catch (err) {
      alert(err.message || 'Failed to save product.');
    }
  };

  const startEdit = (p) => {
    clearSelectedImage();

    setEditingId(p.foodId);

    setForm({
      foodName: p.foodName,
      foodDes: p.foodDes,
      price: p.price,
      category: p.category,
      pic: p.pic,
    });

    setPreview(p.pic);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleDelete = async (p) => {
    if (window.confirm(`Delete ${p.foodName}?`)) {
      try {
        await deleteProduct(p.foodId);

        if (editingId === p.foodId) {
          cancelEdit();
        }
      } catch (err) {
        alert(err.message || 'Failed to delete product.');
      }
    }
  };

  /* ---------- ORDERS ---------- */

  const handleStatusChange = async (id, status) => {
    await updateOrderStatus(id, status);
  };

  const handleOrderDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    await deleteOrder(id);
  };

  /* ---------- LOGOUT ---------- */

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /* ---------- IMAGE PREVIEW CLEANUP ---------- */

  useEffect(() => {
    return () => {
      if (selectedFile && preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [selectedFile, preview]);

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
          <div className="stat">
            <h2>{activeCount}</h2>
            <p>Active orders</p>
          </div>

          <div className="stat">
            <h2>{products.length}</h2>
            <p>Products</p>
          </div>

          <div className="stat">
            <h2>Php {revenue}</h2>
            <p>Completed sales</p>
          </div>
        </div>

        <div className="tabs">
          <button
            className={tab === 'orders' ? 'tab active' : 'tab'}
            onClick={() => setTab('orders')}
          >
            Orders
          </button>

          <button
            className={tab === 'sales' ? 'tab active' : 'tab'}
            onClick={() => setTab('sales')}
          >
            Sales
          </button>

          <button
            className={tab === 'products' ? 'tab active' : 'tab'}
            onClick={() => setTab('products')}
          >
            Products
          </button>

          <button
            className={tab === 'branches' ? 'tab active' : 'tab'}
            onClick={() => setTab('branches')}
          >
            Branches
          </button>
        </div>

        {/* ---------- ORDERS ---------- */}

        {tab === 'orders' && (
          <>
            <div className="tabs">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  className={typeFilter === t ? 'tab active' : 'tab'}
                  onClick={() => setTypeFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {loading && <p>Loading orders...</p>}

            {error && <p className="form-error">{error}</p>}

            {!loading && shownOrders.length === 0 && (
              <p>No orders yet.</p>
            )}

            {shownOrders.map((o) => (
              <div className="order-card" key={o.id}>
                <div className="order-head">
                  <span>
                    <strong>Order #{String(o.id).slice(-5)}</strong>

                    {o.type && (
                      <span className={`type-tag ${o.type.toLowerCase()}`}>
                        {o.type}
                      </span>
                    )}
                  </span>

                  <span>
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleString()
                      : 'Date unavailable'}
                  </span>
                </div>

                <p className="order-customer">
                  {o.name ? `${o.name} · ${o.phone}` : o.customer}
                </p>

                {o.type && (
                  <div className="order-details">
                    {o.type === 'Delivery' ? (
                      <p>
                        <strong>Deliver to:</strong> {o.address}
                      </p>
                    ) : (
                      <p>
                        <strong>Branch:</strong> {o.branchName}
                      </p>
                    )}

                    <p>
                      <strong>When:</strong> {o.when}
                    </p>

                    <p>
                      <strong>Payment:</strong> {o.payment}
                    </p>

                    {o.notes && (
                      <p>
                        <strong>Notes:</strong> {o.notes}
                      </p>
                    )}
                  </div>
                )}

                <ul>
                  {o.items.map((i, idx) => (
                    <li key={idx}>
                      {i.qty} × {i.name} (Php {i.price * i.qty})
                    </li>
                  ))}
                </ul>

                <div className="order-foot">
                  <strong>
                    Total: Php {o.total}
                    {o.fee > 0 && ` (incl. Php ${o.fee} delivery)`}
                  </strong>

                  <div>
                    <select
                      value={o.status}
                      onChange={(e) =>
                        handleStatusChange(o.id, e.target.value)
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      className="danger"
                      onClick={() => handleOrderDelete(o.id)}
                    >
                      Delete
                    </button>
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
              <div className="stat">
                <h2>Php {revenue}</h2>
                <p>Total sales</p>
              </div>

              <div className="stat">
                <h2>Php {todaySales}</h2>
                <p>Today</p>
              </div>

              <div className="stat">
                <h2>{completed.length}</h2>
                <p>Completed orders</p>
              </div>

              <div className="stat">
                <h2>Php {avgOrder}</h2>
                <p>Average order</p>
              </div>
            </div>

            <div className="panel">
              <h2>Last 7 days</h2>

              <div className="chart">
                {last7.map((d, idx) => (
                  <div className="bar-col" key={idx}>
                    <span className="bar-value">
                      {d.total > 0 ? d.total : ''}
                    </span>

                    <div
                      className="bar"
                      style={{
                        height: `${(d.total / maxDay) * 100}%`,
                      }}
                    />

                    <span className="bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>Best sellers</h2>

              {bestSellers.length === 0 ? (
                <p>
                  No completed orders yet. Mark an order as Completed
                  to see sales here.
                </p>
              ) : (
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sold</th>
                      <th>Revenue</th>
                    </tr>
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

              <input
                name="foodName"
                placeholder="Name"
                value={form.foodName}
                onChange={handleChange}
                required
              />

              <input
                name="foodDes"
                placeholder="Description"
                value={form.foodDes}
                onChange={handleChange}
                required
              />

              <input
                name="price"
                type="number"
                min="1"
                placeholder="Price (Php)"
                value={form.price}
                onChange={handleChange}
                required
              />

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="Pastry">Pastry</option>
                <option value="Beverage">Beverage</option>
              </select>

              <label htmlFor="product-image">
                Product image
              </label>

              <input
                id="product-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />

              {preview && (
                <div className="image-preview">
                  <img
                    src={preview.startsWith('blob:') ? preview : imageUrl(preview)}
                    alt="Product preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'contain',
                    }}
                  />

                  <p>
                    {selectedFile
                      ? selectedFile.name
                      : 'Current product image'}
                  </p>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={clearSelectedImage}
                    >
                      Remove selected image
                    </button>
                  )}
                </div>
              )}

              {imageError && (
                <p className="form-error">{imageError}</p>
              )}

              <div>
                <button type="submit" className="primary">
                  {editingId ? 'Save changes' : 'Add product'}
                </button>

                {editingId && (
                  <button type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {products.map((p) => (
              <div className="product-row" key={p.foodId}>
                <img src={imageUrl(p.pic)} alt={p.foodName} />

                <div className="product-info">
                  <h3>{p.foodName}</h3>
                  <p>{p.category} · Php {p.price}</p>

                  {p.available === false && (
                    <span className="badge">Sold out</span>
                  )}
                </div>

                <div className="product-actions">
                  <button
                    onClick={() =>
                      updateProduct(p.foodId, {
                        available: p.available === false,
                      })
                    }
                  >
                    {p.available === false
                      ? 'Mark available'
                      : 'Mark sold out'}
                  </button>

                  <button onClick={() => startEdit(p)}>Edit</button>

                  <button
                    className="danger"
                    onClick={() => handleDelete(p)}
                  >
                    Delete
                  </button>
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
