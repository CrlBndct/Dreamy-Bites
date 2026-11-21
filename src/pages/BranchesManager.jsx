import { useState } from 'react';
import { useBranches } from '../BranchesContext';

const EMPTY = {
  name: '', address: '', phone: '',
  lat: '', lng: '', open: '08:00', close: '19:00',
};

export default function BranchesManager() {
  const { branches, addBranch, updateBranch, deleteBranch } = useBranches();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, lat: Number(form.lat), lng: Number(form.lng) };
    if (editingId) {
      updateBranch(editingId, data);
    } else {
      addBranch(data);
    }
    setForm(EMPTY);
    setEditingId(null);
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({
      name: b.name, address: b.address, phone: b.phone,
      lat: b.lat, lng: b.lng, open: b.open, close: b.close,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleDelete = (b) => {
    if (window.confirm(`Delete ${b.name}?`)) {
      deleteBranch(b.id);
      if (editingId === b.id) cancelEdit();
    }
  };

  return (
    <>
      <form className="product-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit branch' : 'Add a branch'}</h2>

        <input name="name" placeholder="Branch name" value={form.name} onChange={handleChange} required />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />

        <input name="lat" type="number" step="any" placeholder="Latitude (e.g. 14.2813)"
          value={form.lat} onChange={handleChange} required />
        <input name="lng" type="number" step="any" placeholder="Longitude (e.g. 121.4164)"
          value={form.lng} onChange={handleChange} required />

        <label>Opens at <input name="open" type="time" value={form.open} onChange={handleChange} required /></label>
        <label>Closes at <input name="close" type="time" value={form.close} onChange={handleChange} required /></label>

        <div>
          <button type="submit" className="primary">
            {editingId ? 'Save changes' : 'Add branch'}
          </button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {branches.map((b) => (
        <div className="product-row" key={b.id}>
          <div className="product-info">
            <h3>{b.name}</h3>
            <p>{b.address} · {b.open} - {b.close}</p>
            {b.available === false && <span className="badge">Temporarily closed</span>}
          </div>

          <div className="product-actions">
            <button onClick={() => updateBranch(b.id, { available: b.available === false })}>
              {b.available === false ? 'Reopen' : 'Close temporarily'}
            </button>
            <button onClick={() => startEdit(b)}>Edit</button>
            <button className="danger" onClick={() => handleDelete(b)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}