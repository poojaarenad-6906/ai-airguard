import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { runJourneyAgent } from '../services/agentService';
import { searchBengaluruLocations } from '../utils/bengaluruLocations';
import { getAqiLevel } from '../utils/aqiHelpers';

// Fix Leaflet default icon in Vite/webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HEALTH_PROFILES = [
  { id: 'adults',   label: 'Healthy Adults',       icon: '👤', desc: 'Normal health, no known conditions' },
  { id: 'children', label: 'Children',              icon: '👧', desc: 'Under 12 years — extra sensitive' },
  { id: 'elderly',  label: 'Elderly (60+)',         icon: '👴', desc: 'Senior citizens — reduced lung capacity' },
  { id: 'asthma',   label: 'Asthma / Respiratory',  icon: '🫁', desc: 'Asthma, COPD, respiratory conditions' },
  { id: 'cardiac',  label: 'Cardiovascular',         icon: '❤️', desc: 'Heart disease, hypertension' },
];

const QUICK_ROUTES = [
  { origin: 'Jayanagar',    dest: 'Electronic City' },
  { origin: 'Electronic City', dest: 'Manyata Tech Park' },
  { origin: 'Whitefield',   dest: 'Koramangala' },
  { origin: 'Hebbal',       dest: 'BTM Layout' },
];

// Map fit helper
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [32, 32] });
    }
  }, [bounds, map]);
  return null;
}

// AQI mini card
function AqiCard({ label, data, icon }) {
  if (!data) return null;
  const level = getAqiLevel(data.aqi);
  return (
    <div style={{
      flex: 1, padding: '12px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${level.border}`,
      minWidth: 0,
    }}>
      <div style={{ color: '#8BA8C4', fontSize: '0.72rem', marginBottom: 4 }}>{icon} {label}</div>
      <div style={{ color: level.color, fontWeight: 800, fontSize: '1.3rem', lineHeight: 1 }}>{data.aqi}</div>
      <div style={{ color: '#DBEAFE', fontSize: '0.78rem', marginTop: 3, fontWeight: 600 }}>{data.location || data.city}</div>
      <div style={{ color: '#8BA8C4', fontSize: '0.7rem', marginTop: 2 }}>
        PM2.5: {data.pm25} μg/m³ · {data.primarySource || ''}
      </div>
      <span style={{
        display: 'inline-block', marginTop: 5, padding: '2px 8px', borderRadius: 20,
        background: level.bg, color: level.color, border: `1px solid ${level.border}`,
        fontSize: '0.68rem', fontWeight: 700,
      }}>{level.label}</span>
    </div>
  );
}

export default function AirSafeJourney({ airData }) {
  const [origin, setOrigin]           = useState('');
  const [destination, setDest]        = useState('');
  const [healthProfile, setProfile]   = useState('adults');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [originSugs, setOriginSugs]   = useState([]);
  const [destSugs, setDestSugs]       = useState([]);
  const [showOriginSug, setShowOriginSug] = useState(false);
  const [showDestSug, setShowDestSug]     = useState(false);
  const [userPos, setUserPos]         = useState(null);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsError, setGpsError]       = useState('');
  const [mapKey, setMapKey]           = useState(0); // force remount on new route

  // Stale-request guard
  const reqCounter = useRef(0);
  const watchRef   = useRef(null);

  // ── GPS tracking ────────────────────────────────────────────────────────────
  function startGps() {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported'); return; }
    setGpsError('');
    setGpsTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => { setGpsError('GPS error: ' + err.message); setGpsTracking(false); },
      { enableHighAccuracy: true }
    );
  }
  function stopGps() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setGpsTracking(false);
  }
  useEffect(() => () => stopGps(), []);

  // ── Autocomplete handlers ────────────────────────────────────────────────────
  function handleOriginChange(v) {
    setOrigin(v);
    if (v.length >= 2) { setOriginSugs(searchBengaluruLocations(v, 6)); setShowOriginSug(true); }
    else setShowOriginSug(false);
  }
  function handleDestChange(v) {
    setDest(v);
    if (v.length >= 2) { setDestSugs(searchBengaluruLocations(v, 6)); setShowDestSug(true); }
    else setShowDestSug(false);
  }

  // ── Route analysis ───────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!origin.trim() || !destination.trim()) return;
    const myReq = ++reqCounter.current;
    setLoading(true);
    setResult(null);
    setMapKey(k => k + 1);
    try {
      const res = await runJourneyAgent(origin.trim(), destination.trim(), healthProfile);
      if (myReq !== reqCounter.current) return; // stale — newer request in flight
      setResult(res);
    } catch (err) {
      if (myReq === reqCounter.current) setResult({ error: err.message });
    } finally {
      if (myReq === reqCounter.current) setLoading(false);
    }
  }

  const profileInfo = HEALTH_PROFILES.find(p => p.id === healthProfile);

  // ── Map geometry ─────────────────────────────────────────────────────────────
  const routeGeometry = result?.routeInfo?.geometry; // [[lng, lat], ...]
  // Leaflet wants [[lat, lng]]
  const polylinePositions = routeGeometry
    ? routeGeometry.map(([lng, lat]) => [lat, lng])
    : [];

  const mapBounds = polylinePositions.length >= 2
    ? [
        [Math.min(...polylinePositions.map(p => p[0])), Math.min(...polylinePositions.map(p => p[1]))],
        [Math.max(...polylinePositions.map(p => p[0])), Math.max(...polylinePositions.map(p => p[1]))],
      ]
    : null;

  const mapCenter = mapBounds
    ? [(mapBounds[0][0] + mapBounds[1][0]) / 2, (mapBounds[0][1] + mapBounds[1][1]) / 2]
    : [12.9716, 77.5946];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">🚗 AirSafe Journey Planner</h2>
        <p className="section-subtitle">
          AI-powered pollution-aware route planning with personalized health risk assessment — powered by IBM Granite
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Left Panel: Input + Health Profile ── */}
        <div>
          <div className="glass-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>📍 Route Details</h3>

            {/* Origin */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <label style={{ color: '#8BA8C4', fontSize: '0.82rem', display: 'block', marginBottom: 6 }}>
                🟢 Starting Point
              </label>
              <input className="input-field"
                placeholder="e.g. Koramangala, HSR Layout…"
                value={origin}
                onChange={e => handleOriginChange(e.target.value)}
                onFocus={() => originSugs.length > 0 && setShowOriginSug(true)}
                onBlur={() => setTimeout(() => setShowOriginSug(false), 160)}
              />
              {showOriginSug && originSugs.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#0d2847', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  {originSugs.map(s => (
                    <div key={s.name} onMouseDown={() => { setOrigin(s.name); setShowOriginSug(false); }}
                      style={{ padding: '8px 14px', cursor: 'pointer', color: '#DBEAFE', fontSize: '0.85rem',
                        borderBottom: '1px solid rgba(53,81,109,0.3)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      📍 {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <label style={{ color: '#8BA8C4', fontSize: '0.82rem', display: 'block', marginBottom: 6 }}>
                🔴 Destination
              </label>
              <input className="input-field"
                placeholder="e.g. Whitefield, Electronic City…"
                value={destination}
                onChange={e => handleDestChange(e.target.value)}
                onFocus={() => destSugs.length > 0 && setShowDestSug(true)}
                onBlur={() => setTimeout(() => setShowDestSug(false), 160)}
              />
              {showDestSug && destSugs.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#0d2847', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  {destSugs.map(s => (
                    <div key={s.name} onMouseDown={() => { setDest(s.name); setShowDestSug(false); }}
                      style={{ padding: '8px 14px', cursor: 'pointer', color: '#DBEAFE', fontSize: '0.85rem',
                        borderBottom: '1px solid rgba(53,81,109,0.3)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      📍 {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick routes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8BA8C4', fontSize: '0.78rem', marginBottom: 8 }}>⚡ Quick routes:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {QUICK_ROUTES.map(r => (
                  <button key={r.origin + r.dest} className="btn btn-ghost btn-sm"
                    onClick={() => { setOrigin(r.origin); setDest(r.dest); }}
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                    {r.origin} → {r.dest}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }}
              onClick={handleAnalyze}
              disabled={loading || !origin.trim() || !destination.trim()}>
              {loading
                ? <><span className="spinner-sm" /> Analyzing Route…</>
                : <>🔍 Analyze AirSafe Route</>}
            </button>

            {/* GPS toggle */}
            <button className="btn btn-ghost" style={{ width: '100%', fontSize: '0.82rem' }}
              onClick={gpsTracking ? stopGps : startGps}>
              {gpsTracking ? '🔴 Stop GPS Tracking' : '📡 Enable Live GPS Tracking'}
            </button>
            {gpsError && <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: 6 }}>{gpsError}</p>}
            {gpsTracking && userPos && (
              <p style={{ color: '#22C55E', fontSize: '0.75rem', marginTop: 6 }}>
                📡 GPS active: {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}
              </p>
            )}
          </div>

          {/* Health Profile */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>🩺 Health Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HEALTH_PROFILES.map(p => (
                <div key={p.id} onClick={() => setProfile(p.id)}
                  style={{
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    background: healthProfile === p.id ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${healthProfile === p.id ? 'rgba(56,189,248,0.4)' : 'rgba(53,81,109,0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                  }}>
                  <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: healthProfile === p.id ? '#38BDF8' : '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{p.label}</div>
                    <div style={{ color: '#8BA8C4', fontSize: '0.75rem' }}>{p.desc}</div>
                  </div>
                  {healthProfile === p.id && <span style={{ color: '#38BDF8', fontSize: '1.1rem' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Results ── */}
        <div>
          {/* Empty state */}
          {!result && !loading && (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🗺️</div>
              <h3 style={{ marginBottom: 12, color: '#8DD8FF' }}>Plan Your AirSafe Journey</h3>
              <p style={{ color: '#8BA8C4', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto' }}>
                Enter your origin and destination to get IBM Granite-powered pollution-aware route recommendations with real distance, travel time, and health risk scoring.
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Jayanagar → Electronic City', 'Hebbal → BTM Layout', 'Whitefield → Koramangala'].map(r => (
                  <span key={r} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(56,189,248,0.3)', color: '#8BA8C4', fontSize: '0.78rem' }}>{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 20px' }} />
              <p style={{ color: '#8DD8FF', fontWeight: 600 }}>IBM Granite analyzing your route…</p>
              <p style={{ color: '#8BA8C4', fontSize: '0.82rem', marginTop: 8 }}>
                Fetching real route · Checking pollution hotspots · Calculating health risk · Finding alternatives
              </p>
            </div>
          )}

          {/* Results */}
          {result && !result.error && (
            <div className="fade-in">

              {/* Route header + stats */}
              <div className="glass-card" style={{ marginBottom: 16, borderColor: 'rgba(56,189,248,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
                      🚗 {result.origin} → {result.destination}
                    </h3>
                    {result.routeInfo && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ color: '#38BDF8', fontSize: '0.82rem', fontWeight: 700 }}>
                          📏 {result.routeInfo.distance_km} km
                        </span>
                        {result.routeInfo.source && (
                          <span style={{
                            padding: '1px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                            background: result.routeInfo.source === 'ors' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                            color: result.routeInfo.source === 'ors' ? '#22C55E' : '#EAB308',
                            border: `1px solid ${result.routeInfo.source === 'ors' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
                          }}>
                            {result.routeInfo.source === 'ors' ? '✅ OpenRouteService' : '📐 Distance Estimate'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                    background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)',
                  }}>
                    {profileInfo?.icon} {profileInfo?.label}
                  </span>
                </div>

                {/* Origin + Destination AQI cards */}
                {(result.originData || result.destData) && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                    <AqiCard label="Origin AQI" data={result.originData} icon="🟢" />
                    <div style={{ display: 'flex', alignItems: 'center', color: '#35516D', fontSize: '1.4rem' }}>→</div>
                    <AqiCard label="Destination AQI" data={result.destData} icon="🔴" />
                  </div>
                )}

                {/* Travel times */}
                {result.travelTime && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                        <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '1rem' }}>{result.travelTime.base}</div>
                        <div style={{ color: '#8BA8C4', fontSize: '0.7rem' }}>Normal</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.06)', borderRadius: 8 }}>
                        <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '1rem' }}>{result.travelTime.peak}</div>
                        <div style={{ color: '#8BA8C4', fontSize: '0.7rem' }}>Peak Hour</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(34,197,94,0.06)', borderRadius: 8 }}>
                        <div style={{ color: '#22C55E', fontWeight: 700, fontSize: '1rem' }}>{result.travelTime.offPeak}</div>
                        <div style={{ color: '#8BA8C4', fontSize: '0.7rem' }}>Off-Peak</div>
                      </div>
                    </div>
                    <div style={{
                      padding: '7px 12px', borderRadius: 6,
                      background: result.travelTime.isCurrentPeakHour ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                      border: `1px solid ${result.travelTime.isCurrentPeakHour ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                    }}>
                      <span style={{ fontSize: '0.82rem', color: result.travelTime.isCurrentPeakHour ? '#EF4444' : '#22C55E' }}>
                        {result.travelTime.isCurrentPeakHour ? '⚠️' : '✅'} {result.travelTime.current}
                        {result.travelTime.source && <span style={{ color: '#8BA8C4', marginLeft: 8, fontSize: '0.72rem' }}>· {result.travelTime.source}</span>}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Route Map */}
              {polylinePositions.length >= 2 && (
                <div className="glass-card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px 8px', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ color: '#8DD8FF', fontWeight: 700, fontSize: '0.9rem' }}>🗺️ Route Map</span>
                    {result.hotspots?.length > 0 && (
                      <span style={{ color: '#8BA8C4', fontSize: '0.75rem', marginLeft: 10 }}>
                        · {result.hotspots.length} hotspot{result.hotspots.length > 1 ? 's' : ''} near route
                      </span>
                    )}
                  </div>
                  <MapContainer
                    key={mapKey}
                    center={mapCenter}
                    zoom={12}
                    style={{ height: 280, width: '100%' }}
                    scrollWheelZoom={false}
                    zoomControl={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {/* Route polyline */}
                    <Polyline
                      positions={polylinePositions}
                      pathOptions={{ color: '#38BDF8', weight: 4, opacity: 0.9, dashArray: undefined }}
                    />
                    {/* Origin marker (green) */}
                    <CircleMarker
                      center={polylinePositions[0]}
                      radius={8}
                      pathOptions={{ color: '#22C55E', fillColor: '#22C55E', fillOpacity: 1, weight: 2 }}
                    >
                      <Popup>{result.origin}</Popup>
                    </CircleMarker>
                    {/* Destination marker (red) */}
                    <CircleMarker
                      center={polylinePositions[polylinePositions.length - 1]}
                      radius={8}
                      pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1, weight: 2 }}
                    >
                      <Popup>{result.destination}</Popup>
                    </CircleMarker>
                    {/* Hotspot markers (orange) */}
                    {result.hotspots?.map((h, i) => (
                      <CircleMarker
                        key={i}
                        center={[h.lat, h.lng]}
                        radius={6}
                        pathOptions={{ color: '#F97316', fillColor: '#F97316', fillOpacity: 0.8, weight: 2 }}
                      >
                        <Popup>
                          <strong style={{ color: '#F97316' }}>⚠️ {h.name}</strong><br />
                          AQI: {h.aqi}<br />
                          {h.warning}
                        </Popup>
                      </CircleMarker>
                    ))}
                    {/* Live GPS position (blue) */}
                    {userPos && (
                      <CircleMarker
                        center={[userPos.lat, userPos.lng]}
                        radius={8}
                        pathOptions={{ color: '#8DD8FF', fillColor: '#38BDF8', fillOpacity: 1, weight: 3 }}
                      >
                        <Popup>📡 Your Location</Popup>
                      </CircleMarker>
                    )}
                    <FitBounds bounds={mapBounds} />
                  </MapContainer>
                  <div style={{ padding: '6px 14px 10px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8BA8C4', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} /> Origin
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#8BA8C4', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} /> Destination
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#8BA8C4', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 32, height: 3, background: '#38BDF8', display: 'inline-block', borderRadius: 2 }} /> Route
                    </span>
                    {result.hotspots?.length > 0 && (
                      <span style={{ fontSize: '0.7rem', color: '#8BA8C4', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} /> Hotspot
                      </span>
                    )}
                    {userPos && (
                      <span style={{ fontSize: '0.7rem', color: '#8BA8C4', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38BDF8', display: 'inline-block' }} /> GPS
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* IBM Granite AI Analysis */}
              <div className="glass-card" style={{ marginBottom: 16, borderColor: 'rgba(56,189,248,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span>🤖</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.9rem' }}>IBM Granite Route Analysis</span>
                  {result.provider && (
                    <span style={{
                      marginLeft: 'auto', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem',
                      background: result.provider === 'watsonx' ? 'rgba(56,189,248,0.1)' : result.provider === 'groq' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                      color: result.provider === 'watsonx' ? '#38BDF8' : result.provider === 'groq' ? '#22C55E' : '#EAB308',
                      border: `1px solid ${result.provider === 'watsonx' ? 'rgba(56,189,248,0.3)' : result.provider === 'groq' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
                    }}>
                      {result.provider === 'watsonx' ? '🔵 IBM Granite' : result.provider === 'groq' ? '⚡ Groq Fallback' : '🔧 Demo'}
                    </span>
                  )}
                </div>
                <p style={{ color: '#DBEAFE', fontSize: '0.88rem', lineHeight: 1.75, whiteSpace: 'pre-line', margin: 0 }}>
                  {result.routeAnalysis}
                </p>
              </div>

              {/* Hotspots en route */}
              {result.hotspots?.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>
                    ⚠️ Pollution Hotspots Near Route
                    <span style={{ color: '#8BA8C4', fontSize: '0.75rem', fontWeight: 400, marginLeft: 8 }}>
                      (within ~2.5 km of route corridor)
                    </span>
                  </h3>
                  {result.hotspots.map((h, i) => {
                    const level = getAqiLevel(h.aqi);
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                        padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                        border: '1px solid rgba(53,81,109,0.3)',
                      }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 8, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', background: level.bg, border: `1px solid ${level.border}`,
                          fontWeight: 800, color: level.color, fontSize: '0.9rem', flexShrink: 0,
                        }}>{h.aqi}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#DBEAFE', fontSize: '0.85rem', fontWeight: 600 }}>{h.name}</div>
                          <div style={{ color: '#8BA8C4', fontSize: '0.73rem' }}>
                            {h.warning}
                            {h.type && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 10, background: 'rgba(249,115,22,0.1)', color: '#F97316', fontSize: '0.65rem' }}>{h.type}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span className="badge" style={{ background: level.bg, color: level.color, border: `1px solid ${level.border}`, fontSize: '0.68rem', display: 'block', marginBottom: 3 }}>
                            {level.label}
                          </span>
                          {h.distFromRoute !== undefined && (
                            <span style={{ color: '#8BA8C4', fontSize: '0.68rem' }}>~{h.distFromRoute} km</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ color: '#8BA8C4', fontSize: '0.7rem', margin: '8px 0 0', fontStyle: 'italic' }}>
                    ⚠️ Estimates based on Bengaluru pollution patterns — not live sensor readings
                  </p>
                </div>
              )}

              {result.hotspots?.length === 0 && (
                <div className="glass-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
                  <p style={{ color: '#22C55E', fontSize: '0.85rem', margin: 0 }}>
                    ✅ No major pollution hotspots identified along this route corridor.
                  </p>
                </div>
              )}

              {/* Alternative Routes */}
              {result.alternatives?.length > 0 && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>🔄 Alternative Routes</h3>
                  {result.alternatives.map((a, i) => (
                    <div key={i} style={{
                      padding: '12px 14px', marginBottom: 8, borderRadius: 8,
                      background: a.recommended ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${a.recommended ? 'rgba(34,197,94,0.3)' : 'rgba(53,81,109,0.3)'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ color: a.recommended ? '#22C55E' : '#DBEAFE', fontWeight: 700, fontSize: '0.88rem' }}>
                          {a.recommended ? '⭐ ' : ''}{a.route}
                        </span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                          background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)',
                        }}>
                          {a.pollutionReduction} less pollution
                        </span>
                      </div>
                      {a.duration_note && (
                        <div style={{ color: '#8BA8C4', fontSize: '0.75rem' }}>⏱️ {a.duration_note}</div>
                      )}
                      {a.note && (
                        <div style={{ color: '#8BA8C4', fontSize: '0.73rem', marginTop: 3 }}>💡 {a.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {result?.error && (
            <div className="glass-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              <p style={{ color: '#EF4444', margin: 0 }}>❌ {result.error}</p>
              <p style={{ color: '#8BA8C4', fontSize: '0.8rem', marginTop: 8 }}>
                Check that the backend server is running on port 5000.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
