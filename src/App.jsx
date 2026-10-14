import { useState, useCallback } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import HealthRecommendations from './components/HealthRecommendations';
import SmartAlerts from './components/SmartAlerts';
import AqiCharts from './components/AqiCharts';
import AIAssistant from './components/AIAssistant';
import PollutionInsights from './components/PollutionInsights';
import { fetchAirQuality } from './services/airQualityService';
import './styles/global.css';

// Sections that require city data to be loaded first
const DATA_SECTIONS = ['dashboard', 'charts'];

// Full-screen loading overlay shown while fetching
function LoadingOverlay({ city }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5,11,24,0.88)',
      backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20,
    }}>
      <div className="spinner" style={{ width: 56, height: 56, borderWidth: 4 }} />
      <p style={{ color: '#8DD8FF', fontSize: '1.1rem', fontWeight: 600 }}>
        Checking air quality for <strong style={{ color: '#fff' }}>{city}</strong>…
      </p>
      <p style={{ color: '#8BA8C4', fontSize: '0.85rem' }}>Fetching data, please wait</p>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [airData, setAirData]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [loadingCity, setLoadingCity] = useState('');
  const [error, setError]         = useState('');

  const handleSearch = useCallback(async (cityName) => {
    setLoading(true);
    setLoadingCity(cityName);
    setError('');
    try {
      const data = await fetchAirQuality(cityName);
      setAirData(data);
      setActiveSection('dashboard');
    } catch (err) {
      setError(err.message || 'Failed to fetch air quality data. Please try again.');
      setActiveSection('home');
    } finally {
      setLoading(false);
      setLoadingCity('');
    }
  }, []);

  function handleNavigate(section) {
    if (DATA_SECTIONS.includes(section) && !airData) {
      setActiveSection('home');
      return;
    }
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNewSearch() {
    setActiveSection('home');
    setAirData(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <BackgroundCanvas />

      {/* Full-screen loading overlay — never leaves a blank screen */}
      {loading && <LoadingOverlay city={loadingCity} />}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar activeSection={activeSection} onNavigate={handleNavigate} />

        {/* Global error banner */}
        {error && !loading && (
          <div className="container" style={{ paddingTop: 110 }}>
            <div className="glass-card" style={{
              padding: '18px 24px',
              borderColor: 'rgba(255,87,34,0.45)',
              background: 'rgba(255,87,34,0.08)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: '1.5rem' }}>❌</span>
              <div>
                <strong style={{ color: '#FF7043' }}>Search Error</strong>
                <p style={{ color: '#8BA8C4', fontSize: '0.88rem', marginTop: 2 }}>{error}</p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => setError('')}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── Page routing ── */}
        {activeSection === 'home' && (
          <HomePage onSearch={handleSearch} loading={loading} />
        )}

        {activeSection === 'dashboard' && airData && (
          <>
            <Dashboard data={airData} onNewSearch={handleNewSearch} />
            <HealthRecommendations data={airData} />
            <SmartAlerts data={airData} />
          </>
        )}

        {activeSection === 'charts' && airData && (
          <div style={{ paddingTop: 100 }}>
            <AqiCharts data={airData} />
          </div>
        )}

        {activeSection === 'assistant' && (
          <div style={{ paddingTop: 100 }}>
            <AIAssistant data={airData} />
          </div>
        )}

        {activeSection === 'insights' && (
          <div style={{ paddingTop: 100 }}>
            <PollutionInsights />
          </div>
        )}

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '32px 24px',
          color: '#4A6682',
          fontSize: '0.8rem',
          borderTop: '1px solid rgba(141,216,255,0.08)',
          marginTop: 40,
        }}>
          <p>🌬️ <strong style={{ color: '#8BA8C4' }}>AI AirGuard</strong> — Daily Air Quality Action Agent</p>
          <p style={{ marginTop: 6 }}>
            Data source:{' '}
            <a href="https://openweathermap.org/api/air-pollution" target="_blank" rel="noopener noreferrer">
              OpenWeatherMap Air Pollution API
            </a>
            {' · '}Health recommendations are general guidance only, not medical advice.
          </p>
        </footer>
      </div>
    </>
  );
}
