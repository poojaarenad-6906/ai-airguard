import { useState } from 'react';
import '../styles/home.css';

export default function HomePage({ onSearch, loading }) {
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) { setError('Please enter a city name.'); return; }
    setError('');
    onSearch(trimmed);
  }

  return (
    <section className="home-section">
      <div className="container home-inner">
        {/* Hero */}
        <div className="hero fade-in">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Live Air Quality Intelligence
          </div>
          <h1 className="hero-title">
            Breathe Smarter.<br />
            <span className="hero-accent">Live Healthier.</span>
          </h1>
          <p className="hero-subtitle">
            AI AirGuard monitors real-time air pollution levels for cities worldwide,
            provides personalised health guidance, and helps you make informed daily
            decisions — powered by live AQI data.
          </p>

          {/* Search */}
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="input-field search-input"
                type="text"
                placeholder="Enter city name (e.g. Mumbai, London, Delhi)"
                value={city}
                onChange={(e) => { setCity(e.target.value); setError(''); }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary search-btn"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-sm" /> Checking…</>
                : <><span>🌍</span> Check Air Quality</>
              }
            </button>
          </form>
          {error && <p className="search-error">{error}</p>}

          {/* Quick city picks */}
          <div className="quick-cities">
            <span className="quick-label">Quick check:</span>
            {['Delhi', 'Mumbai', 'London', 'New York', 'Beijing', 'Sydney'].map((c) => (
              <button
                key={c}
                className="btn btn-ghost btn-sm quick-btn"
                onClick={() => { setCity(c); onSearch(c); }}
                disabled={loading}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="feature-grid fade-in">
          {[
            { icon: '📡', title: 'Live AQI Data',    desc: 'Real-time air quality from OpenWeatherMap API' },
            { icon: '🩺', title: 'Health Guidance',   desc: 'Personalised recommendations based on AQI' },
            { icon: '📊', title: 'Trend Charts',      desc: 'Visual pollution analytics and pollutant breakdown' },
            { icon: '🤖', title: 'AI Assistant',      desc: 'Ask questions about air quality and pollution' },
            { icon: '🚨', title: 'Smart Alerts',      desc: 'Colour-coded warnings when air quality deteriorates' },
            { icon: '🌱', title: 'Pollution Insights', desc: 'Learn about AQI, PM2.5, PM10, and more' },
          ].map((f) => (
            <div key={f.title} className="glass-card feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
