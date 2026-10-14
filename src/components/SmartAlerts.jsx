import { getAqiLevel } from '../utils/aqiHelpers';
import '../styles/alerts.css';

const ALERT_LEVELS = [
  {
    minAqi: 1,
    maxAqi: 1,
    type: 'info',
    title: 'Air Quality is Good',
    icon: '🌿',
    tips: ['Air quality poses no significant health risk today.', 'Great conditions for outdoor activities.', 'Enjoy the fresh air!'],
  },
  {
    minAqi: 2,
    maxAqi: 2,
    type: 'info',
    title: 'Air Quality is Fair',
    icon: '✅',
    tips: ['Air quality is acceptable for most people.', 'Very sensitive individuals may experience minor effects.', 'Continue normal activities.'],
  },
  {
    minAqi: 3,
    maxAqi: 3,
    type: 'warning',
    title: 'Moderate Air Quality Warning',
    icon: '⚠️',
    tips: ['Sensitive individuals should reduce prolonged outdoor exertion.', 'People with asthma may experience symptoms.', 'Monitor air quality updates throughout the day.'],
  },
  {
    minAqi: 4,
    maxAqi: 4,
    type: 'danger',
    title: 'Poor Air Quality Alert',
    icon: '🚨',
    tips: ['Everyone may begin to experience adverse health effects.', 'Reduce outdoor activities significantly.', 'Wear an N95 mask if going outside.', 'Use an air purifier indoors.'],
  },
  {
    minAqi: 5,
    maxAqi: 5,
    type: 'critical',
    title: 'Very Poor Air Quality — Health Emergency',
    icon: '⛔',
    tips: ['Avoid all outdoor exposure.', 'Stay indoors with windows and doors sealed.', 'Wear a full respirator if you must go outside.', 'Seek medical attention if experiencing breathing difficulty.'],
  },
];

export default function SmartAlerts({ data }) {
  if (!data) return null;
  const level  = getAqiLevel(data.aqi);
  const alert  = ALERT_LEVELS.find((a) => data.aqi >= a.minAqi && data.aqi <= a.maxAqi);

  return (
    <section className="section fade-in">
      <div className="container">
        <div className="section-title">
          <h2>🚨 Smart Alerts</h2>
          <p>Real-time air quality alerts and colour-coded health warnings for {data.city}.</p>
        </div>

        {/* Primary alert card */}
        <div className={`glass-card primary-alert alert-${alert.type}`}>
          <div className="primary-alert-icon">{alert.icon}</div>
          <div className="primary-alert-body">
            <h3 style={{ color: level.color }}>{alert.title}</h3>
            <p className="primary-alert-city">📍 {data.city}{data.country ? `, ${data.country}` : ''} — AQI {data.aqi} ({level.label})</p>
            <ul className="alert-tips">
              {alert.tips.map((tip, i) => (
                <li key={i}>
                  <span className="alert-bullet" style={{ color: level.color }}>›</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="primary-alert-aqi" style={{ color: level.color }}>
            {data.aqi}
          </div>
        </div>

        {/* All-level indicator grid */}
        <h3 className="alerts-subtitle">AQI Alert Levels Reference</h3>
        <div className="alerts-grid">
          {ALERT_LEVELS.map((al) => {
            const lv = getAqiLevel(al.minAqi);
            const isActive = data.aqi >= al.minAqi && data.aqi <= al.maxAqi;
            return (
              <div
                key={al.minAqi}
                className={`glass-card alert-level-card ${isActive ? 'active-level' : ''}`}
                style={{
                  borderColor: isActive ? lv.border : 'rgba(141,216,255,0.1)',
                  background: isActive ? lv.bg : undefined,
                }}
              >
                <span className="al-icon">{al.icon}</span>
                <div>
                  <div className="al-label" style={{ color: lv.color }}>AQI {al.minAqi} · {lv.label}</div>
                  <div className="al-desc">{lv.description}</div>
                </div>
                {isActive && <span className="al-current-badge">Current</span>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
