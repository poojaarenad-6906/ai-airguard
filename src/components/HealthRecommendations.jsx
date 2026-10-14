import { useState } from 'react';
import { getAqiLevel, HEALTH_RECOMMENDATIONS, GROUP_RECOMMENDATIONS } from '../utils/aqiHelpers';
import '../styles/recommendations.css';

const GROUPS = Object.entries(GROUP_RECOMMENDATIONS).map(([key, val]) => ({
  key,
  label: val.label,
  icon: val.icon,
}));

export default function HealthRecommendations({ data }) {
  const [activeGroup, setActiveGroup] = useState('adult');

  if (!data) return null;

  const level = getAqiLevel(data.aqi);
  const recs  = HEALTH_RECOMMENDATIONS[data.aqi] || HEALTH_RECOMMENDATIONS[3];
  const groupRec = GROUP_RECOMMENDATIONS[activeGroup];
  const groupTips = groupRec.tips[data.aqi] || groupRec.tips[3];

  return (
    <section className="section fade-in">
      <div className="container">
        <div className="section-title">
          <h2>🩺 Health Recommendations</h2>
          <p>General guidance based on current AQI for {data.city}. This is not medical advice.</p>
        </div>

        {/* Alert banner */}
        {data.aqi >= 4 && (
          <div className="glass-card alert-banner fade-in" style={{ borderColor: level.border, background: level.bg }}>
            <span className="alert-icon">{recs.icon}</span>
            <div>
              <strong style={{ color: level.color }}>Air Quality Alert — {level.label}</strong>
              <p>{level.description}</p>
            </div>
          </div>
        )}

        {/* General tips */}
        <div className="rec-grid">
          <div className="glass-card rec-card">
            <div className="rec-card-header" style={{ borderBottom: `2px solid ${level.color}` }}>
              <span style={{ fontSize: '1.6rem' }}>{recs.icon}</span>
              <h3>General Precautions</h3>
              <span className="badge" style={{ background: level.bg, color: level.color, border: `1px solid ${level.border}` }}>
                AQI {data.aqi} · {level.label}
              </span>
            </div>
            <ul className="rec-list">
              {recs.general.map((tip, i) => (
                <li key={i} className="rec-item">
                  <span className="rec-dot" style={{ background: level.color }} />
                  {tip}
                </li>
              ))}
            </ul>
            <p className="rec-disclaimer">
              ⚕️ These are general informational guidelines only, not medical advice. Consult a healthcare professional for personal health decisions.
            </p>
          </div>

          {/* Personalized plan */}
          <div className="glass-card rec-card">
            <h3 className="rec-card-title">👥 Personalised Action Plan</h3>
            <div className="group-tabs">
              {GROUPS.map((g) => (
                <button
                  key={g.key}
                  className={`group-tab ${activeGroup === g.key ? 'active' : ''}`}
                  onClick={() => setActiveGroup(g.key)}
                >
                  <span>{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
            <div className="group-tips fade-in" key={activeGroup}>
              <div className="group-header">
                <span style={{ fontSize: '2rem' }}>{groupRec.icon}</span>
                <div>
                  <strong style={{ color: '#90CAF9' }}>{groupRec.label}</strong>
                  <div className="badge" style={{ background: level.bg, color: level.color, border: `1px solid ${level.border}`, marginTop: 6 }}>
                    {level.label} conditions
                  </div>
                </div>
              </div>
              <ul className="rec-list">
                {groupTips.map((tip, i) => (
                  <li key={i} className="rec-item">
                    <span className="rec-dot" style={{ background: level.color }} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <p className="rec-disclaimer">
              ⚕️ These suggestions are for general reference only and do not replace professional medical advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
