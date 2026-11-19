import { useState } from 'react';
import { simulatePollution } from '../services/aiService';

const SCENARIOS = [
  { id: 'traffic', icon: '🚗', label: 'Traffic Surge', desc: 'Simulate 50% increase in vehicle traffic on major roads', params: { increase: '50%', roads: ['ORR', 'Silk Board', 'KR Puram'] } },
  { id: 'construction', icon: '🏗️', label: 'Construction Dust', desc: 'Major construction activity within 1km radius', params: { radius: '1km', type: 'road construction' } },
  { id: 'wind', icon: '💨', label: 'Wind Direction Change', desc: 'Industrial area emissions shift to residential zones', params: { from: 'Peenya', to: 'residential areas', speed: '15 km/h' } },
  { id: 'rainfall', icon: '🌧️', label: 'Heavy Rainfall', desc: 'Simulate rain effect on pollution levels', params: { intensity: 'heavy', duration: '2 hours' } },
  { id: 'festival', icon: '🎆', label: 'Festival/Fireworks', desc: 'Diwali or public celebration fireworks simulation', params: { duration: '4 hours', type: 'fireworks' } },
  { id: 'industrial', icon: '🏭', label: 'Industrial Accident', desc: 'Emission spike from industrial accident scenario', params: { facility: 'Peenya cluster', pollutant: 'SO2+PM' } },
];

export default function WhatIfSimulator({ data }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [customParams, setCustomParams] = useState({});

  async function runSimulation() {
    if (!selected) return;
    setLoading(true);
    setResult(null);
    try {
      const scenario = SCENARIOS.find(s => s.id === selected);
      const res = await simulatePollution({ type: selected, params: { ...scenario.params, ...customParams } });
      setResult(res);
    } catch (err) {
      setResult(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">🔬 What-If Pollution Simulator</h2>
        <p className="section-subtitle">Simulate environmental scenarios and their impact on Bengaluru air quality</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Scenario selection */}
        <div>
          <div className="glass-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>🎯 Select Scenario</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SCENARIOS.map(s => (
                <div
                  key={s.id}
                  onClick={() => { setSelected(s.id); setResult(null); }}
                  style={{
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    background: selected === s.id ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selected === s.id ? 'rgba(56,189,248,0.4)' : 'rgba(53,81,109,0.3)'}`,
                    display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'all 0.2s',
                  }}>
                  <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                  <div>
                    <div style={{ color: selected === s.id ? '#38BDF8' : '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{s.label}</div>
                    <div style={{ color: '#8BA8C4', fontSize: '0.78rem', marginTop: 2 }}>{s.desc}</div>
                  </div>
                  {selected === s.id && <span style={{ marginLeft: 'auto', color: '#38BDF8' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div className="glass-card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>⚙️ Scenario Parameters</h3>
              {Object.entries(SCENARIOS.find(s => s.id === selected)?.params || {}).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <label style={{ color: '#8BA8C4', fontSize: '0.78rem', display: 'block', marginBottom: 4, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</label>
                  <input className="input-field" style={{ padding: '7px 12px', fontSize: '0.85rem' }}
                    defaultValue={typeof v === 'string' ? v : JSON.stringify(v)}
                    onChange={e => setCustomParams(prev => ({ ...prev, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={runSimulation}
            disabled={!selected || loading}>
            {loading ? <><span className="spinner-sm" /> Running Simulation…</> : <>🚀 Run What-If Simulation</>}
          </button>
        </div>

        {/* Result */}
        <div>
          {!result && !loading && (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔬</div>
              <h3 style={{ color: '#8DD8FF', marginBottom: 12 }}>Environmental Simulator</h3>
              <p style={{ color: '#8BA8C4', fontSize: '0.9rem' }}>Select a scenario to simulate its environmental impact on Bengaluru. Powered by IBM Granite predictive modeling.</p>
              {data && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(56,189,248,0.07)', borderRadius: 8 }}>
                  <span style={{ color: '#38BDF8', fontSize: '0.82rem' }}>📍 Base location: {data.location || data.city} · AQI: {data.aqi}</span>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 20px' }} />
              <p style={{ color: '#8DD8FF' }}>IBM Granite running simulation…</p>
              <p style={{ color: '#8BA8C4', fontSize: '0.82rem', marginTop: 8 }}>Modeling environmental impact · Calculating health effects</p>
            </div>
          )}

          {result && (
            <div className="glass-card fade-in" style={{ borderColor: 'rgba(56,189,248,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span>🤖</span>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>IBM Granite Simulation Result</span>
                <span className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)', fontSize: '0.68rem' }}>
                  {SCENARIOS.find(s => s.id === selected)?.icon} {SCENARIOS.find(s => s.id === selected)?.label}
                </span>
              </div>
              <div style={{ color: '#DBEAFE', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{result}</div>
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(234,179,8,0.07)', borderRadius: 8 }}>
                <span style={{ color: '#EAB308', fontSize: '0.78rem' }}>⚠️ Simulation results are AI-generated estimates based on Bengaluru pollution patterns. Not real-time measurements.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
