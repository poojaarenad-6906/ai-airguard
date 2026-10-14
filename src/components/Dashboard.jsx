import { getAqiLevel, getAqiPercentage, formatPollutant, formatDateTime } from '../utils/aqiHelpers';
import '../styles/dashboard.css';

function AqiGauge({ aqi }) {
  const level = getAqiLevel(aqi);
  const pct = getAqiPercentage(aqi);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="gauge-wrap">
      <svg className="gauge-svg" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(141,216,255,0.1)" strokeWidth="12" />
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={level.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
        />
        <text x="90" y="82" textAnchor="middle" fill={level.color} fontSize="36" fontWeight="800">{aqi}</text>
        <text x="90" y="104" textAnchor="middle" fill="#8BA8C4" fontSize="12">AQI Index</text>
      </svg>
      <div className="gauge-label" style={{ color: level.color }}>{level.label}</div>
    </div>
  );
}

function PollutantCard({ label, value, unit, icon }) {
  return (
    <div className="glass-card pollutant-card">
      <span className="pollutant-icon">{icon}</span>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{formatPollutant(value, unit)}</div>
    </div>
  );
}

export default function Dashboard({ data, onNewSearch }) {
  if (!data) return null;
  const level = getAqiLevel(data.aqi);

  return (
    <section className="section dashboard-section fade-in">
      <div className="container">
        {/* Header row */}
        <div className="dash-header">
          <div>
            <div className="dash-city">
              <span className="city-flag">📍</span>
              <h2>{data.city}{data.country ? `, ${data.country}` : ''}</h2>
            </div>
            <p className="dash-updated">
              Last updated: {formatDateTime(data.updatedAt)}
            </p>
          </div>
          <div className="dash-header-right">
            {data.isDemo && (
              <span className="demo-notice">⚠️ Sample Data — Demo Mode</span>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onNewSearch}>
              🔄 New Search
            </button>
          </div>
        </div>

        {/* Main AQI card */}
        <div className="glass-card dash-main-card" style={{ borderColor: level.border }}>
          <div className="dash-main-left">
            <AqiGauge aqi={data.aqi} />
          </div>
          <div className="dash-main-right">
            <div className="dash-aqi-badge badge" style={{ background: level.bg, color: level.color, border: `1px solid ${level.border}` }}>
              {level.label}
            </div>
            <p className="dash-aqi-desc">{level.description}</p>
            <div className="dash-aqi-bar-wrap">
              {[1,2,3,4,5].map((i) => {
                const l = getAqiLevel(i);
                return (
                  <div
                    key={i}
                    className="aqi-bar-seg"
                    style={{
                      background: l.color,
                      opacity: i === data.aqi ? 1 : 0.25,
                      transform: i === data.aqi ? 'scaleY(1.3)' : 'scaleY(1)',
                    }}
                    title={l.label}
                  />
                );
              })}
            </div>
            <div className="aqi-bar-labels">
              <span>Good</span><span>Fair</span><span>Moderate</span><span>Poor</span><span>Very Poor</span>
            </div>
          </div>
        </div>

        {/* Pollutant cards */}
        <h3 className="pollutants-title">Pollutant Measurements</h3>
        <div className="grid-4 pollutant-grid">
          <PollutantCard label="PM2.5" value={data.pm25} unit="μg/m³" icon="💨" />
          <PollutantCard label="PM10"  value={data.pm10} unit="μg/m³" icon="🌫️" />
          <PollutantCard label="NO₂"   value={data.no2}  unit="μg/m³" icon="⚗️" />
          <PollutantCard label="O₃"    value={data.o3}   unit="μg/m³" icon="🌀" />
          <PollutantCard label="CO"    value={data.co}   unit="μg/m³" icon="🏭" />
          <PollutantCard label="SO₂"   value={data.so2}  unit="μg/m³" icon="🔬" />
          <PollutantCard label="NH₃"   value={data.nh3}  unit="μg/m³" icon="🧪" />
        </div>
      </div>
    </section>
  );
}
