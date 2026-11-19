import { useState, useEffect } from 'react';
import { getAqiLevel, getAqiPercentage, formatPollutant, formatDateTime } from '../utils/aqiHelpers';

function AqiGauge({ aqi }) {
  const level = getAqiLevel(aqi);
  const pct = getAqiPercentage(aqi);
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 180 180" style={{ width: 180, height: 180 }}>
        <circle cx="90" cy="90" r={radius + 8} fill="none" stroke={level.color} strokeWidth="1" opacity="0.15" />
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(141,216,255,0.1)" strokeWidth="12" />
        <circle cx="90" cy="90" r={radius} fill="none" stroke={level.color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 8px ${level.color}88)` }} />
        <text x="90" y="80" textAnchor="middle" fill={level.color} fontSize="38" fontWeight="900">{aqi}</text>
        <text x="90" y="100" textAnchor="middle" fill="#8BA8C4" fontSize="11">Indian AQI</text>
      </svg>
      <div style={{ color: level.color, fontWeight: 800, fontSize: '1.1rem', marginTop: 4 }}>{level.label}</div>
    </div>
  );
}

function PollutantBar({ label, value, max, unit, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#DBEAFE', fontSize: '0.85rem' }}>{label}</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{formatPollutant(value, unit)}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color || '#38BDF8' }} />
      </div>
    </div>
  );
}

export default function Dashboard({ data, agentResults, onNewSearch, onNavigate, searchHistory, onHistorySearch, user, onProfileClick }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) return null;
  const level = getAqiLevel(data.aqi);
  const monitoring = agentResults?.monitoring;
  const source     = agentResults?.source;
  const health     = agentResults?.health;
  const environmental = agentResults?.environmental;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <section style={{ paddingTop: 80, paddingBottom: 40 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Personalized user banner (shown only when logged in) ── */}
        {user && (
          <div className="fade-in" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderRadius: 12, marginBottom: 20,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(14,165,233,0.05))',
            border: '1px solid rgba(56,189,248,0.2)',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#38BDF8,#0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 800, color: '#0F1E32',
                boxShadow: '0 0 12px rgba(56,189,248,0.3)',
              }}>
                {(user.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                  {greeting}, <span style={{ color: '#38BDF8' }}>{user.full_name?.split(' ')[0] || 'there'}</span>! 👋
                </div>
                <div style={{ color: '#8BA8C4', fontSize: '0.78rem', marginTop: 1 }}>
                  📍 Viewing air quality for <strong style={{ color: '#DBEAFE' }}>{data.location || data.city}</strong>
                  {user.city && user.city.toLowerCase() !== (data.location || data.city).toLowerCase() && (
                    <span style={{ marginLeft: 8, color: '#8BA8C4' }}>
                      · Your home: <span style={{ color: '#38BDF8' }}>{user.city}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {user.notify_enabled ? (
                <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', fontSize: '0.72rem', fontWeight: 600 }}>
                  🔔 Alerts on (AQI &gt; {user.notify_threshold || 150})
                </span>
              ) : (
                <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(53,81,109,0.3)', border: '1px solid #35516D', color: '#8BA8C4', fontSize: '0.72rem' }}>
                  🔕 Alerts off
                </span>
              )}
              <button onClick={onProfileClick}
                style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38BDF8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                👤 My Profile
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontSize: '1.6rem' }}>📍 {data.location || data.city}</h2>
            </div>
            <p style={{ color: '#8BA8C4', fontSize: '0.85rem' }}>
              Updated: {formatDateTime(data.updatedAt)} · Source: {data.dataSource || 'AI AirGuard'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('map')}>🗺️ View Map</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('charts')}>📈 Trends</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('journey')}>🚗 AirSafe</button>
            <button className="btn btn-ghost btn-sm" onClick={onNewSearch}>🔄 New Search</button>
          </div>
        </div>

        {/* Search history */}
        {searchHistory?.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#8BA8C4', fontSize: '0.8rem' }}>📜 Recent:</span>
            {searchHistory.map(h => {
              const l = getAqiLevel(h.aqi);
              return (
                <button key={h.city} className="btn btn-ghost btn-sm"
                  onClick={() => onHistorySearch(h.city)}
                  style={{ fontSize: '0.78rem', padding: '3px 10px', borderColor: l.border }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, display: 'inline-block', marginRight: 4 }} />
                  {h.city} · {h.aqi}
                </button>
              );
            })}
          </div>
        )}

        {/* Main AQI card */}
        <div className="glass-card fade-in" style={{ borderColor: level.border, marginBottom: 24, padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'center' }}>
            <AqiGauge aqi={data.aqi} />
            <div>
              <span className="badge" style={{ background: level.bg, color: level.color, border: `1px solid ${level.border}`, fontSize: '0.9rem', marginBottom: 10, display: 'inline-flex' }}>
                {level.label}
              </span>
              <p style={{ color: '#DBEAFE', marginBottom: 16, fontSize: '0.95rem' }}>{level.description}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[50, 100, 200, 300, 400].map((threshold, i) => {
                  const labels = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor'];
                  const colors = ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444'];
                  const isActive = data.aqi <= threshold && (i === 0 || data.aqi > [0, 50, 100, 200, 300][i]);
                  return (
                    <div key={threshold} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: 8, borderRadius: 4, background: colors[i], opacity: isActive ? 1 : 0.25, transform: isActive ? 'scaleY(1.5)' : 'scaleY(1)', transition: 'all 0.3s' }} />
                      <div style={{ fontSize: '0.6rem', color: '#8BA8C4', marginTop: 4, whiteSpace: 'nowrap' }}>{labels[i]}</div>
                    </div>
                  );
                })}
              </div>

              {data.primarySource && (
                <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(56,189,248,0.07)', borderRadius: 8, border: '1px solid rgba(56,189,248,0.2)' }}>
                  <span style={{ color: '#8DD8FF', fontSize: '0.82rem' }}>🏭 Primary Source: </span>
                  <span style={{ color: '#DBEAFE', fontSize: '0.82rem' }}>{data.primarySource}</span>
                  {data.temp && <span style={{ color: '#8BA8C4', fontSize: '0.8rem', marginLeft: 16 }}>🌡️ {data.temp}°C · 💧 {data.humidity}% · 💨 {data.windSpeed} m/s</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pollutant bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>💨 Pollutant Levels</h3>
            <PollutantBar label="PM2.5" value={data.pm25} max={120} unit="μg/m³" color={data.pm25 > 60 ? '#EF4444' : '#38BDF8'} />
            <PollutantBar label="PM10"  value={data.pm10} max={200} unit="μg/m³" color={data.pm10 > 100 ? '#F97316' : '#38BDF8'} />
            <PollutantBar label="NO₂"   value={data.no2}  max={100} unit="μg/m³" color={data.no2 > 80 ? '#EAB308' : '#38BDF8'} />
          </div>
          <div className="glass-card">
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>⚗️ Other Pollutants</h3>
            <PollutantBar label="SO₂"  value={data.so2} max={80}   unit="μg/m³" color="#8DD8FF" />
            <PollutantBar label="CO"   value={data.co}  max={2000} unit="μg/m³" color="#38BDF8" />
            <PollutantBar label="O₃"   value={data.o3}  max={100}  unit="μg/m³" color="#22C55E" />
          </div>
        </div>

        {/* AI Analysis */}
        {monitoring?.aiAnalysis && (
          <div className="glass-card fade-in" style={{ marginBottom: 24, borderColor: 'rgba(56,189,248,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span>🤖</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>IBM Granite AI Analysis</span>
              <span className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)', fontSize: '0.7rem' }}>Monitoring Agent</span>
            </div>
            <p style={{ color: '#DBEAFE', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{monitoring.aiAnalysis}</p>
          </div>
        )}

        {/* Agent Results Grid */}
        {agentResults && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {health && (
              <div className="glass-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>🩺 Health Advisory</h3>
                <div style={{ marginBottom: 8 }}>
                  <span className="badge" style={{ background: `${health.riskLevel?.color}22`, color: health.riskLevel?.color, border: `1px solid ${health.riskLevel?.color}44` }}>
                    {health.riskLevel?.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#DBEAFE' }}>
                  {health.precautions?.slice(0, 3).map((p, i) => (
                    <div key={i} style={{ marginBottom: 4, display: 'flex', gap: 6 }}>
                      <span style={{ color: '#38BDF8' }}>•</span> {p}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(34,197,94,0.07)', borderRadius: 6 }}>
                  <span style={{ fontSize: '0.78rem', color: '#22C55E' }}>😷 {health.maskRecommendation}</span>
                </div>
              </div>
            )}

            {source && (
              <div className="glass-card" style={{ borderColor: 'rgba(234,179,8,0.3)' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>🏭 Source Analysis</h3>
                {source.sources?.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ color: '#DBEAFE', fontSize: '0.8rem' }}>{s.type}</span>
                    <span style={{ color: s.severity === 'High' ? '#EF4444' : s.severity === 'Medium' ? '#EAB308' : '#22C55E', fontWeight: 700, fontSize: '0.8rem' }}>{s.contribution}%</span>
                  </div>
                ))}
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#8BA8C4' }}>
                  🌬️ {source.weatherInfluence}
                </div>
              </div>
            )}

            {environmental && (
              <div className="glass-card" style={{ borderColor: 'rgba(141,216,255,0.3)' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>🌍 Environmental Score</h3>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: environmental.environmentalScore > 60 ? '#22C55E' : environmental.environmentalScore > 40 ? '#EAB308' : '#EF4444' }}>
                    {environmental.environmentalScore}
                  </div>
                  <div style={{ color: '#8BA8C4', fontSize: '0.78rem' }}>/ 100 Environmental Score</div>
                </div>
                {environmental.recommendations?.slice(0, 2).map((r, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: '#DBEAFE', marginBottom: 4, display: 'flex', gap: 6 }}>
                    <span style={{ color: '#38BDF8' }}>→</span> {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick nav */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: '🗺️', label: 'Pollution Map',   sec: 'map' },
            { icon: '🚗', label: 'AirSafe Journey', sec: 'journey' },
            { icon: '📈', label: 'AQI Trends',      sec: 'charts' },
            { icon: '🚨', label: 'Smart Alerts',    sec: 'alerts' },
          ].map(n => (
            <button key={n.sec} className="glass-card btn-ghost"
              onClick={() => onNavigate(n.sec)}
              style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: 12 }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{n.icon}</div>
              <div style={{ color: '#DBEAFE', fontSize: '0.82rem', fontWeight: 600 }}>{n.label}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
