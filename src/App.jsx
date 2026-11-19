import { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import BengaluruMap from './components/BengaluruMap';
import AQICharts from './components/AQICharts';
import AirSafeJourney from './components/AirSafeJourney';
import AIAssistant from './components/AIAssistant';
import SmartAlerts from './components/SmartAlerts';
import WhatIfSimulator from './components/WhatIfSimulator';
import CitizenReport from './components/CitizenReport';
import GuardrailPanel from './components/GuardrailPanel';
import EvaluationDashboard from './components/EvaluationDashboard';
import AgentPanel from './components/AgentPanel';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import { fetchAirQuality, fetchHotspotData } from './services/airQualityService';
import { orchestrateAgents } from './services/agentService';
import { getStoredUser, fetchMe, logout, checkAndTriggerAlerts } from './services/authService';

function LoadingOverlay({ city }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,30,50,0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div className="spinner" style={{ width: 56, height: 56 }} />
      <p style={{ color: '#8DD8FF', fontSize: '1.1rem', fontWeight: 700 }}>
        Analyzing air quality for <strong style={{ color: '#fff' }}>{city}</strong>…
      </p>
      <p style={{ color: '#8BA8C4', fontSize: '0.85rem' }}>Running 5-agent analysis · IBM Granite processing</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {['📡 Monitoring', '🔥 Hotspots', '🏭 Sources', '🩺 Health', '🌍 Environment'].map((a, i) => (
          <span key={a} style={{
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', color: '#8DD8FF',
            animation: `fadeIn 0.3s ease ${i * 0.2}s both`,
          }}>{a}</span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection]   = useState('home');
  const [airData, setAirData]               = useState(null);
  const [agentResults, setAgentResults]     = useState(null);
  const [hotspots, setHotspots]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [loadingCity, setLoadingCity]       = useState('');
  const [error, setError]                   = useState('');
  const [searchHistory, setSearchHistory]   = useState([]);

  // ── Auth state ────────────────────────────────────────────────────────────
  const [user, setUser]                     = useState(null);
  const [authModal, setAuthModal]           = useState(false);
  const [authTab, setAuthTab]               = useState('login');
  const [showProfile, setShowProfile]       = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      // Re-validate token against backend in background
      fetchMe().then(u => { if (u) setUser(u); }).catch(() => { logout(); setUser(null); });
    }
  }, []);

  // Check URL for reset_token param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset_token')) {
      setAuthTab('login'); // Show login with note; actual reset handled inside AuthModal
      setAuthModal(true);
    }
  }, []);

  // Load initial hotspot data
  useEffect(() => {
    fetchHotspotData().then(setHotspots).catch(() => {});
  }, []);

  // ── Location search ───────────────────────────────────────────────────────
  const handleSearch = useCallback(async (locationName, lat, lng) => {
    setLoading(true);
    setLoadingCity(locationName);
    setError('');
    try {
      const data = await fetchAirQuality(locationName, lat, lng);
      setAirData(data);

      // Run agents in background
      orchestrateAgents(data, hotspots).then(results => setAgentResults(results)).catch(console.warn);

      // Trigger email alerts for registered users (non-blocking)
      checkAndTriggerAlerts(data);

      setSearchHistory(prev => {
        const filtered = prev.filter(h => h.city.toLowerCase() !== data.city.toLowerCase());
        return [{ city: data.city, aqi: data.aqi }, ...filtered].slice(0, 5);
      });
      setActiveSection('dashboard');
    } catch (err) {
      setError(err.message || 'Failed to fetch air quality data. Please try again.');
    } finally {
      setLoading(false);
      setLoadingCity('');
    }
  }, [hotspots]);

  function navigate(section) {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNewSearch() {
    setActiveSection('home');
    setAirData(null);
    setAgentResults(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Auth handlers ─────────────────────────────────────────────────────────
  function handleAuthSuccess(loggedInUser) {
    setUser(loggedInUser);
    setAuthModal(false);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setShowProfile(false);
  }

  function handleProfileUpdate(updatedUser) {
    setUser(updatedUser);
  }

  const DATA_SECTIONS = ['dashboard', 'charts', 'alerts'];

  return (
    <>
      {loading && <LoadingOverlay city={loadingCity} />}

      {/* Auth modal */}
      {authModal && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthModal(false)}
          initialTab={authTab}
        />
      )}

      {/* User profile modal */}
      {showProfile && user && (
        <UserProfile
          user={user}
          onUpdate={handleProfileUpdate}
          onClose={() => setShowProfile(false)}
        />
      )}

      <Navbar
        activeSection={activeSection}
        onNavigate={navigate}
        hasData={!!airData}
        user={user}
        onLoginClick={() => { setAuthTab('login'); setAuthModal(true); }}
        onLogout={handleLogout}
        onProfileClick={() => setShowProfile(true)}
      />

      {error && !loading && (
        <div className="container" style={{ paddingTop: 100 }}>
          <div className="glass-card" style={{ padding: '16px 24px', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <span style={{ fontSize: '1.4rem' }}>❌</span>
            <div>
              <strong style={{ color: '#EF4444' }}>Error</strong>
              <p style={{ color: '#8BA8C4', fontSize: '0.88rem', marginTop: 2 }}>{error}</p>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setError('')}>Dismiss</button>
          </div>
        </div>
      )}

      {/* ── Page Routing ── */}
      {activeSection === 'home' && (
        <HomePage onSearch={handleSearch} loading={loading} hotspots={hotspots} />
      )}

      {activeSection === 'dashboard' && airData && (
        <Dashboard
          data={airData} agentResults={agentResults}
          onNewSearch={handleNewSearch} onNavigate={navigate}
          searchHistory={searchHistory} onHistorySearch={handleSearch}
        />
      )}

      {activeSection === 'map' && (
        <div style={{ paddingTop: 80 }}>
          <BengaluruMap hotspots={hotspots} selectedLocation={airData} onLocationSelect={handleSearch} />
        </div>
      )}

      {activeSection === 'charts' && airData && (
        <div style={{ paddingTop: 80 }}>
          <AQICharts data={airData} />
        </div>
      )}

      {activeSection === 'journey' && (
        <div style={{ paddingTop: 80 }}>
          <AirSafeJourney airData={airData} />
        </div>
      )}

      {activeSection === 'alerts' && airData && (
        <div style={{ paddingTop: 80 }}>
          <SmartAlerts data={airData} hotspots={hotspots} />
        </div>
      )}

      {activeSection === 'assistant' && (
        <div style={{ paddingTop: 80 }}>
          <AIAssistant data={airData} />
        </div>
      )}

      {activeSection === 'simulator' && (
        <div style={{ paddingTop: 80 }}>
          <WhatIfSimulator data={airData} />
        </div>
      )}

      {activeSection === 'report' && (
        <div style={{ paddingTop: 80 }}>
          <CitizenReport />
        </div>
      )}

      {activeSection === 'agents' && (
        <div style={{ paddingTop: 80 }}>
          <AgentPanel agentResults={agentResults} airData={airData}
            onRunAgents={() => airData && orchestrateAgents(airData, hotspots).then(setAgentResults)} />
        </div>
      )}

      {activeSection === 'guardrails' && (
        <div style={{ paddingTop: 80 }}>
          <GuardrailPanel />
        </div>
      )}

      {activeSection === 'evaluation' && (
        <div style={{ paddingTop: 80 }}>
          <EvaluationDashboard agentResults={agentResults} />
        </div>
      )}

      {/* Show data sections from home if no data */}
      {DATA_SECTIONS.includes(activeSection) && !airData && (
        <div className="container" style={{ paddingTop: 120, textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: '48px', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📍</div>
            <h3 style={{ marginBottom: 12 }}>Search a Location First</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Enter a Bengaluru location to load air quality data.</p>
            <button className="btn btn-primary" onClick={() => navigate('home')}>🏠 Go to Search</button>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '32px 24px', color: '#4A6682', fontSize: '0.8rem', borderTop: '1px solid rgba(141,216,255,0.08)', marginTop: 40 }}>
        <p>🌬️ <strong style={{ color: '#8BA8C4' }}>AI AirGuard</strong> — Bengaluru Air Quality & Pollution Action Advisor</p>
        <p style={{ marginTop: 6, color: '#35516D' }}>Powered by IBM Granite · watsonx.ai · 5 Collaborating AI Agents · 9 Guardrail Layers</p>
      </footer>
    </>
  );
}
