import { useEffect, useRef, useState } from 'react';
import { getAqiLevel } from '../utils/aqiHelpers';
import { BENGALURU_LOCATIONS } from '../utils/bengaluruLocations';

const BENGALURU_CENTER = [12.9716, 77.5946];

function getMarkerColor(aqi) {
  const level = getAqiLevel(aqi);
  return level.color;
}

export default function BengaluruMap({ hotspots = [], selectedLocation, onLocationSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  useEffect(() => {
    // Load leaflet dynamically
    if (mapInstanceRef.current) return;
    
    const initMap = () => {
      if (!mapRef.current || !window.L) return;
      const L = window.L;
      
      const map = L.map(mapRef.current, {
        center: BENGALURU_CENTER,
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add markers when map is ready and hotspots change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const allLocations = hotspots.length > 0 ? hotspots : BENGALURU_LOCATIONS.filter(l => l.hotspot).map(l => ({
      ...l, aqi: 100 + Math.round(Math.random() * 100), name: l.name,
    }));

    allLocations.forEach(loc => {
      if (!loc.lat || !loc.lng) return;
      const aqi = loc.aqi || 100;
      const color = getMarkerColor(aqi);
      const level = getAqiLevel(aqi);
      const size = aqi > 200 ? 32 : aqi > 100 ? 26 : 22;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}33; border: 2px solid ${color};
          display: flex; align-items: center; justify-content: center;
          color: ${color}; font-weight: 900; font-size: ${aqi > 200 ? '11' : '10'}px;
          box-shadow: 0 0 ${aqi > 200 ? '12' : '8'}px ${color}66;
          cursor: pointer;
        ">${aqi}</div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 200px; color: #fff; background: #183B63; padding: 12px; border-radius: 8px;">
            <strong style="color: #8DD8FF;">📍 ${loc.name || loc.location || 'Unknown'}</strong><br>
            <div style="margin: 8px 0;">
              <span style="color: ${color}; font-size: 1.5rem; font-weight: 900;">${aqi}</span>
              <span style="color: #DBEAFE; margin-left: 8px;">${level.label}</span>
            </div>
            ${loc.pm25 ? `<div style="color: #DBEAFE; font-size: 0.82rem;">PM2.5: ${loc.pm25} μg/m³</div>` : ''}
            ${loc.primarySource ? `<div style="color: #8BA8C4; font-size: 0.78rem; margin-top: 4px;">Source: ${loc.primarySource}</div>` : ''}
            <button onclick="document.dispatchEvent(new CustomEvent('mapLocationSelect', {detail: '${loc.name || loc.location || ''}' }))"
              style="margin-top: 8px; padding: 4px 10px; background: #38BDF8; color: #0F1E32; border: none; border-radius: 4px; cursor: pointer; font-size: 0.78rem; font-weight: 700;">
              Analyze This Location
            </button>
          </div>
        `, { className: 'dark-popup' });

      markersRef.current.push(marker);
    });

    // Selected location marker
    if (selectedLocation?.lat && selectedLocation?.lng) {
      const color = getMarkerColor(selectedLocation.aqi || 100);
      const selectedIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 42px; height: 42px; border-radius: 50%;
          background: ${color}44; border: 3px solid ${color};
          display: flex; align-items: center; justify-content: center;
          color: ${color}; font-weight: 900; font-size: 12px;
          box-shadow: 0 0 20px ${color}88;
          animation: pulse 2s infinite;
        ">📍</div>`,
        iconSize: [42, 42], iconAnchor: [21, 21],
      });
      const sel = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: selectedIcon })
        .addTo(map)
        .bindPopup(`<div style="color: #8DD8FF; font-weight: 700;">${selectedLocation.location || selectedLocation.city}</div>`);
      markersRef.current.push(sel);
      map.setView([selectedLocation.lat, selectedLocation.lng], 13);
    }

  }, [mapReady, hotspots, selectedLocation]);

  // Listen for popup button clicks
  useEffect(() => {
    const handler = (e) => {
      if (onLocationSelect && e.detail) onLocationSelect(e.detail);
    };
    document.addEventListener('mapLocationSelect', handler);
    return () => document.removeEventListener('mapLocationSelect', handler);
  }, [onLocationSelect]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 className="section-title">🗺️ Bengaluru Pollution Live Map</h2>
        <p className="section-subtitle">Click any marker to view detailed air quality data · Hotspots highlighted in red/orange</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Map */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', height: 560 }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {!mapReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)' }}>
              <div className="spinner" />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Legend */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>🎨 AQI Legend</h3>
            {[
              { label: 'Good', aqi: '0–50', color: '#22C55E' },
              { label: 'Satisfactory', aqi: '51–100', color: '#84CC16' },
              { label: 'Moderate', aqi: '101–200', color: '#EAB308' },
              { label: 'Poor', aqi: '201–300', color: '#F97316' },
              { label: 'Very Poor', aqi: '301–400', color: '#EF4444' },
              { label: 'Severe', aqi: '401+', color: '#9333EA' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: l.color, boxShadow: `0 0 6px ${l.color}66`, flexShrink: 0 }} />
                <span style={{ color: '#DBEAFE', fontSize: '0.82rem', flex: 1 }}>{l.label}</span>
                <span style={{ color: '#8BA8C4', fontSize: '0.75rem' }}>{l.aqi}</span>
              </div>
            ))}
          </div>

          {/* Top Hotspots */}
          <div className="glass-card" style={{ flex: 1, overflow: 'auto' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>🔥 Top Hotspots</h3>
            {(hotspots.length > 0 ? hotspots : []).slice(0, 8).sort((a, b) => (b.aqi || 0) - (a.aqi || 0)).map(h => {
              const level = getAqiLevel(h.aqi || 100);
              return (
                <div key={h.name} style={{ marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => onLocationSelect && onLocationSelect(h.name, h.lat, h.lng)}>
                  <span style={{ color: '#DBEAFE', fontSize: '0.8rem', flex: 1 }}>{h.name}</span>
                  <span style={{ color: level.color, fontWeight: 800, fontSize: '0.9rem', marginLeft: 8 }}>{h.aqi || 'N/A'}</span>
                </div>
              );
            })}
            {hotspots.length === 0 && (
              <p style={{ color: '#8BA8C4', fontSize: '0.8rem' }}>Search a location to see hotspot data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
