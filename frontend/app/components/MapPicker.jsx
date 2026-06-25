"use client";
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const city =
      addr.suburb ||
      addr.city_district ||
      addr.city ||
      addr.town ||
      addr.village ||
      addr.county ||
      '';
    return {
      display: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city,
    };
  } catch {
    return { display: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: '' };
  }
}

// onSelect receives { lat, lng, address, city }
export default function MapPicker({ onSelect, initialLat, initialLng, isRTL }) {
  const DEFAULT_CENTER = [30.0444, 31.2357]; // Cairo
  const center = initialLat ? [initialLat, initialLng] : DEFAULT_CENTER;
  const [marker, setMarker] = useState(initialLat ? { lat: initialLat, lng: initialLng } : null);
  const [loading, setLoading] = useState(false);

  const handlePick = async (lat, lng) => {
    setMarker({ lat, lng });
    setLoading(true);
    const { display, city } = await reverseGeocode(lat, lng);
    setLoading(false);
    onSelect({ lat, lng, address: display, city });
  };

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <MapContainer center={center} zoom={11} style={{ height: 360, width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={handlePick} />
        {marker && <Marker position={[marker.lat, marker.lng]} />}
      </MapContainer>

      <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
        {loading ? (
          <>
            <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #cbd5e1', borderTop: '2px solid #008ccf', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            {isRTL ? 'جارٍ تحديد العنوان...' : 'Resolving address...'}
          </>
        ) : marker ? (
          <>📍 {isRTL ? 'تم تحديد الموقع. انقر لتغييره.' : 'Location pinned. Click map to change.'}</>
        ) : (
          <>🖱️ {isRTL ? 'انقر على الخريطة لتحديد الموقع.' : 'Click on the map to pin the location.'}</>
        )}
      </div>
    </div>
  );
}
