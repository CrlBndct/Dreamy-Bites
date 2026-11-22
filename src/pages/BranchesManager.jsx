import { useState } from 'react';
import { useBranches } from '../BranchesContext';

const EMPTY = {
  name: '',
  address: '',
  phone: '',
  lat: '',
  lng: '',
  open: '08:00',
  close: '19:00',
};

export default function BranchesManager() {
  const { branches, addBranch, updateBranch, deleteBranch } = useBranches();

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const data = {
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
      };

      if (editingId !== null) {
        await updateBranch(editingId, data);
      } else {
        await addBranch(data);
      }

      setForm(EMPTY);
      setEditingId(null);
    } catch (err) {
      setError(err.message || 'Failed to save branch.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (b) => {
    setEditingId(b.id);

    setForm({
      name: b.name,
      address: b.address,
      phone: b.phone,
      lat: b.lat,
      lng: b.lng,
      open: b.open,
      close: b.close,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete ${b.name}?`)) return;

    setError('');

    try {
      await deleteBranch(b.id);

      if (editingId === b.id) {
        cancelEdit();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete branch.');
    }
  };

  const handleToggleAvailability = async (b) => {
    setError('');

    try {
      await updateBranch(b.id, {
        available: b.available === false,
      });
    } catch (err) {
      setError(err.message || 'Failed to update branch availability.');
    }
  };

  return (
    <>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form className="product-form" onSubmit={handleSubmit}>
        <h2>{editingId !== null ? 'Edit branch' : 'Add a branch'}</h2>

        <input
          name="name"
          placeholder="Branch name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <input
          name="lat"
          type="number"
          step="any"
          placeholder="Latitude (e.g. 14.2813)"
          value={form.lat}
          onChange={handleChange}
          required
        />

        <input
          name="lng"
          type="number"
          step="any"
          placeholder="Longitude (e.g. 121.4164)"
          value={form.lng}
          onChange={handleChange}
          required
        />

        <label>
          Opens at
          <input
            name="open"
            type="time"
            value={form.open}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Closes at
          <input
            name="close"
            type="time"
            value={form.close}
            onChange={handleChange}
            required
          />
        </label>

        <div>
          <button type="submit" className="primary" disabled={saving}>
            {saving
              ? 'Saving...'
              : editingId !== null
                ? 'Save changes'
                : 'Add branch'}
          </button>

          {editingId !== null && (
            <button type="button" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {branches.map((b) => (
        <div className="product-row" key={b.id}>
          <div className="product-info">
            <h3>{b.name}</h3>

            <p>
              {b.address} · {b.open} - {b.close}
            </p>

            {b.available === false && (
              <span className="badge">Temporarily closed</span>
            )}
          </div>

          <div className="product-actions">
            <button onClick={() => handleToggleAvailability(b)}>
              {b.available === false ? 'Reopen' : 'Close temporarily'}
            </button>

            <button onClick={() => startEdit(b)}>Edit</button>

            <button className="danger" onClick={() => handleDelete(b)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}