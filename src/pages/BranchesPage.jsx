import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useBranches } from '../BranchesContext';
import '../styles/foodpage.css';
import '../styles/branches.css';

// Fix Leaflet's missing marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Straight-line distance in km (Haversine formula)
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function isOpenNow(b) {
  if (b.available === false) return false;

  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  return mins >= toMinutes(b.open) && mins < toMinutes(b.close);
}

// Moves the map when the target changes
function FlyTo({ target }) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo(target, 14);
    }
  }, [target, map]);

  return null;
}

export default function BranchesPage() {
  const { branches, loading, error } = useBranches();

  const [userPos, setUserPos] = useState(null);
  const [status, setStatus] = useState('idle');
  const [selectedId, setSelectedId] = useState(null);

  const findMe = () => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    setStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setStatus('idle');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const list = useMemo(() => {
    const withInfo = branches.map((b) => ({
      ...b,
      isOpen: isOpenNow(b),
      hours: `${b.open} - ${b.close}`,
      distance: userPos
        ? distanceKm(userPos[0], userPos[1], b.lat, b.lng)
        : null,
    }));

    if (userPos) {
      withInfo.sort((a, b) => a.distance - b.distance);
    }

    return withInfo;
  }, [userPos, branches]);

  const nearest = userPos ? list.find((b) => b.isOpen) : null;

  // Select the nearest open branch once the user's location is available
  useEffect(() => {
    if (nearest) {
      setSelectedId(nearest.id);
    }
  }, [nearest?.id]);

  const selected = list.find((b) => b.id === selectedId);
  const focus = selected
    ? [selected.lat, selected.lng]
    : userPos;

  return (
    <>
      <div className="nav">
        <h1 style={{ color: '#80665C' }}>Dreamy Bites</h1>
        <Link to="/homepage" className="backHomeBtn">
          Home
        </Link>
      </div>

      <div className="branches-page">
        <h1>Find a Branch</h1>

        <div className="locate-row">
          <button
            className="locate-btn"
            onClick={findMe}
            disabled={status === 'loading'}
          >
            {status === 'loading'
              ? 'Locating...'
              : 'Find my nearest branch'}
          </button>

          {status === 'denied' && (
            <span className="locate-msg">
              Location is blocked. Allow it in your browser settings, or
              pick a branch below.
            </span>
          )}

          {status === 'unsupported' && (
            <span className="locate-msg">
              Your browser doesn't support location.
            </span>
          )}

          {userPos && nearest && (
            <span className="locate-msg good">
              Nearest open branch:{' '}
              <strong>{nearest.name}</strong> (
              {nearest.distance.toFixed(1)} km away)
            </span>
          )}

          {userPos && !nearest && (
            <span className="locate-msg">
              No branch is open right now.
            </span>
          )}
        </div>

        {loading ? (
          <p>Loading branches...</p>
        ) : error ? (
          <p>{error}</p>
        ) : branches.length === 0 ? (
          <p>No branches are currently available.</p>
        ) : (
          <div className="branches-layout">
            <div className="branch-list">
              {list.map((b) => (
                <div
                  key={b.id}
                  className={
                    b.id === selectedId
                      ? 'branch-card selected'
                      : 'branch-card'
                  }
                  onClick={() => setSelectedId(b.id)}
                >
                  <div className="branch-top">
                    <h3>{b.name}</h3>

                    <span
                      className={b.isOpen ? 'tag open' : 'tag closed'}
                    >
                      {b.isOpen ? 'Open now' : 'Closed'}
                    </span>
                  </div>

                  <p>{b.address}</p>
                  <p>Hours: {b.hours}</p>
                  <p>{b.phone}</p>

                  {b.distance !== null && (
                    <p className="dist">
                      {b.distance.toFixed(1)} km away
                    </p>
                  )}

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Get directions
                  </a>
                </div>
              ))}
            </div>

            <div className="map-wrap">
              <MapContainer
                center={[14.25, 121.3]}
                zoom={10}
                className="map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FlyTo target={focus} />

                {userPos && (
                  <CircleMarker
                    center={userPos}
                    radius={9}
                    pathOptions={{
                      color: '#2563eb',
                      fillOpacity: 0.8,
                    }}
                  >
                    <Popup>You are here</Popup>
                  </CircleMarker>
                )}

                {list.map((b) => (
                  <Marker
                    key={b.id}
                    position={[b.lat, b.lng]}
                    eventHandlers={{
                      click: () => setSelectedId(b.id),
                    }}
                  >
                    <Popup>
                      <strong>{b.name}</strong>
                      <br />
                      {b.isOpen ? 'Open now' : 'Closed'} · {b.hours}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </>
  );
}