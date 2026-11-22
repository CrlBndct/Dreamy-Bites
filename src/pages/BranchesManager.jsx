
import { useState, useEffect } from 'react';
import { useBranches } from '../BranchesContext';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EMPTY = {
  name: '',
  address: '',
  phone: '',
  lat: '',
  lng: '',
  open: '08:00',
  close: '19:00',
};

// Fix Leaflet marker icons in Vite
const markerIcon = L.icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [12.8797, 121.7740];

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });

  return null;
}

function MapCenterUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, Math.max(map.getZoom(), 15));
    }
  }, [map, position]);

  return null;
}

export default function BranchesManager() {
  const { branches, addBranch, updateBranch, deleteBranch } = useBranches();

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const position =
    form.lat !== '' &&
    form.lng !== '' &&
    Number.isFinite(Number(form.lat)) &&
    Number.isFinite(Number(form.lng)) &&
    Number(form.lat) >= -90 &&
    Number(form.lat) <= 90 &&
    Number(form.lng) >= -180 &&
    Number(form.lng) <= 180
      ? [Number(form.lat), Number(form.lng)]
      : null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMapSelect = (latlng) => {
    setForm((prev) => ({
      ...prev,
      lat: latlng.lat.toFixed(7),
      lng: latlng.lng.toFixed(7),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setError('Please select a valid location on the map.');
      return;
    }

    setSaving(true);

    try {
      const data = {
        ...form,
        lat,
        lng,
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

        <label>Select branch location</label>

        <p style={{ fontSize: '14px' }}>
          Click on the map to place the marker. You can also drag
          the marker to adjust the exact location.
        </p>

        <div
          style={{
            height: '350px',
            width: '100%',
            marginBottom: '15px',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <MapContainer
            center={position || DEFAULT_CENTER}
            zoom={position ? 15 : 6}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onSelect={handleMapSelect} />

            {position && (
              <>
                <MapCenterUpdater position={position} />

                <Marker
                  position={position}
                  icon={markerIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend(e) {
                      handleMapSelect(e.target.getLatLng());
                    },
                  }}
                />
              </>
            )}
          </MapContainer>
        </div>

        {position ? (
          <p>
            <strong>Selected coordinates:</strong><br />
            Latitude: {form.lat}<br />
            Longitude: {form.lng}
          </p>
        ) : (
          <p>Select a location on the map to set the coordinates.</p>
        )}

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
          <button
            type="submit"
            className="primary"
            disabled={saving || !position}
          >
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
            <button
              type="button"
              onClick={() => handleToggleAvailability(b)}
            >
              {b.available === false ? 'Reopen' : 'Close temporarily'}
            </button>

            <button type="button" onClick={() => startEdit(b)}>
              Edit
            </button>

            <button
              type="button"
              className="danger"
              onClick={() => handleDelete(b)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
