import { useState, useEffect, useRef, useCallback } from 'react';
import { searchBengaluruLocations } from '../utils/bengaluruLocations';
import { getAqiLevel } from '../utils/aqiHelpers';

const BENGALURU_HOTSPOT_PREVIEW = [
  { name: 'Peenya Industrial Area', aqi: 198, label: 'Poor',      color: '#EF4444' },
  { name: 'Silk Board Junction',    aqi: 162, label: 'Moderate',  color: '#EAB308' },
  { name: 'KR Puram',              aqi: 172, label: 'Moderate',  color: '#EAB308' },
  { name: 'Outer Ring Road',        aqi: 168, label: 'Moderate',  color: '#EAB308' },
  { name: 'Bellandur',              aqi: 185, label: 'Poor',      color: '#F97316' },
  { name: 'Electronic City',        aqi: 145, label: 'Moderate',  color: '#EAB308' },
  { name: 'Whitefield',             aqi: 148, label: 'Moderate',  color: '#EAB308' },
  { name: 'Yelahanka',              aqi: 95,  label: 'Satisfactory', color: '#84CC16' },
];

const STATS = [
  { icon: '🏙️', value: '80+', label: 'Locations Covered' },
  { icon: '⚡', value: 'Real-time', label: 'AQI Updates' },
  { icon: '🤖', value: '5', label: 'AI Agents' },
  { icon: '🛡️', value: '9', label: 'Guardrail Layers' },
];

export default function HomePage({ onSearch, loading, hotspots }) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]       = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Rotate preview
  useEffect(() => {
    const id = setInterval(() => setPreviewIdx(i => (i + 1) % BENGALURU_HOTSPOT_PREVIEW.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Autocomplete
  useEffect(() => {
    if (query.length >= 2) {
      const results = searchBengaluruLocations(query, 8);
      setSuggestions(results);
      setShowSug(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSug(false);
    }
  }, [query]);

  function handleSubmit(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setShowSug(false);
    onSearch(q);
  }

  function handleSuggestionClick(loc) {
    setQuery(loc.name);
    setShowSug(false);
    onSearch(loc.name, loc.lat, loc.lng);
  }

  function handleQuickPick(name) {
    setQuery(name);
    onSearch(name);
  }

  // Voice search
  const startVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceError('Voice search not supported in this browser'); return; }

    if (recognitionRef.current) recognitionRef.current.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => { setIsListening(true); setVoiceError(''); };
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      setQuery(transcript);
      setIsListening(false);
      if (transcript.trim()) onSearch(transcript.trim());
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      setVoiceError(e.error === 'not-allowed' ? 'Microphone permission denied' : `Voice error: ${e.error}`);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [onSearch]);

  const prev = BENGALURU_HOTSPOT_PREVIEW[previewIdx];
  const prevLevel = getAqiLevel(prev.aqi);

  return (
    <section style={{ minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '60px 0 40px' }} className="fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 20, padding: '6px 16px', marginBottom: 24,
          }}>
            <span className="pulse-dot" />
            <span style={{ color: '#38BDF8', fontSize: '0.85rem', fontWeight: 600 }}>Bengaluru Environmental Intelligence · Powered by IBM Granite</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: 16, fontWeight: 900 }}>
            Breathe Smarter.<br />
            <span style={{ color: '#38BDF8' }}>Live Healthier.</span>
          </h1>
          <p style={{ color: '#DBEAFE', fontSize: '1.05rem', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            AI AirGuard monitors Bengaluru's air quality, identifies pollution hotspots,
            and provides personalized health guidance powered by 5 collaborating AI agents and IBM Granite.
          </p>

          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto 16px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', zIndex: 1 }}>📍</span>
                <input
                  ref={inputRef}
                  className="input-field"
                  type="text"
                  placeholder="Search Bengaluru location (e.g. Koramangala, Whitefield…)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSug(true)}
                  onBlur={() => setTimeout(() => setShowSug(false), 200)}
                  disabled={loading}
                  style={{ paddingLeft: 42, paddingRight: 48, height: 52, fontSize: '0.95rem' }}
                />
                {/* Voice button */}
                <button
                  type="button"
                  onClick={startVoice}
                  disabled={loading || isListening}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: isListening ? 'rgba(239,68,68,0.2)' : 'transparent',
                    border: `1px solid ${isListening ? '#ef4444' : 'rgba(56,189,248,0.3)'}`,
                    borderRadius: 6, width: 32, height: 32, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '0.9rem',
                    animation: isListening ? 'pulse 1s infinite' : 'none',
                  }}
                  title={isListening ? 'Listening…' : 'Voice search (English/Kannada)'}
                >
                  {isListening ? '🔴' : '🎤'}
                </button>

                {/* Autocomplete dropdown */}
                {showSug && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: '#0d2847', border: '1px solid var(--border)',
                    borderRadius: 10, marginTop: 4, overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    {suggestions.map(loc => (
                      <div
                        key={loc.name + loc.lat}
                        onMouseDown={() => handleSuggestionClick(loc)}
                        style={{
                          padding: '10px 16px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10,
                          borderBottom: '1px solid rgba(53,81,109,0.3)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '1rem' }}>
                          {loc.type === 'tech-park' ? '🏢' : loc.type === 'industrial' ? '🏭' : loc.type === 'park' ? '🌳' : loc.type === 'transit' ? '🚇' : '📍'}
                        </span>
                        <div>
                          <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{loc.name}</div>
                          <div style={{ color: '#8BA8C4', fontSize: '0.75rem' }}>{loc.zone} · {loc.type}</div>
                        </div>
                        {loc.hotspot && (
                          <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 4, padding: '2px 6px', fontSize: '0.68rem' }}>Hotspot</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: 52, minWidth: 140, fontSize: '0.95rem' }}>
                {loading ? <><span className="spinner-sm" /> Analyzing…</> : <><span>🔍</span> Check AQI</>}
              </button>
            </form>

            {isListening && (
              <div style={{ marginTop: 8, color: '#38BDF8', fontSize: '0.85rem', textAlign: 'center', animation: 'pulse 1s infinite' }}>
                🎤 Listening… Speak your Bengaluru location
              </div>
            )}
            {voiceError && (
              <div style={{ marginTop: 8, color: '#EF4444', fontSize: '0.82rem', textAlign: 'center' }}>{voiceError}</div>
            )}
          </div>

          {/* Quick picks */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
            <span style={{ color: '#8BA8C4', fontSize: '0.82rem', alignSelf: 'center' }}>Quick:</span>
            {['Koramangala', 'Whitefield', 'Peenya', 'Silk Board', 'Hebbal', 'Electronic City', 'Indiranagar', 'HSR Layout'].map(c => (
              <button key={c} className="btn btn-ghost btn-sm" onClick={() => handleQuickPick(c)} disabled={loading}
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }} className="fade-in">
          {STATS.map(s => (
            <div key={s.label} className="glass-card" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ color: '#38BDF8', fontSize: '1.5rem', fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: '#8BA8C4', fontSize: '0.78rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom row: live preview + features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 48 }} className="fade-in">
          {/* AQI Preview */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span>🔴</span>
              <span style={{ color: '#8DD8FF', fontWeight: 700 }}>Live Hotspot Preview</span>
            </div>
            <div key={prev.name} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>📍 {prev.name}</span>
                <span className="badge" style={{ background: prevLevel.bg, color: prevLevel.color, border: `1px solid ${prevLevel.border}` }}>
                  {prevLevel.label}
                </span>
              </div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: prevLevel.color, lineHeight: 1 }}>{prev.aqi}</div>
              <div style={{ color: '#8BA8C4', fontSize: '0.8rem', marginTop: 4 }}>Indian AQI Index</div>
              <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(prev.aqi / 400) * 100}%`, height: '100%', background: prevLevel.color, borderRadius: 3, transition: 'width 1s ease' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {BENGALURU_HOTSPOT_PREVIEW.map((_, i) => (
                <span key={i} onClick={() => setPreviewIdx(i)} style={{
                  width: i === previewIdx ? 16 : 6, height: 6, borderRadius: 3,
                  background: i === previewIdx ? '#38BDF8' : '#35516D', cursor: 'pointer', transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { icon: '📡', title: 'Live AQI Monitoring',    desc: '5-agent AI system analyzing pollution in real-time' },
              { icon: '🗺️', title: 'Interactive Map',         desc: 'Bengaluru pollution hotspot visualization' },
              { icon: '🚗', title: 'AirSafe Journey',         desc: 'Health-aware route planning with risk scoring' },
              { icon: '🤖', title: 'IBM Granite AI',          desc: 'Powered by IBM watsonx.ai Granite model' },
              { icon: '🛡️', title: '9-Layer Guardrails',      desc: 'Production-grade AI safety and compliance' },
              { icon: '📋', title: 'Agent Evaluation',        desc: 'Real-time LLM and agent performance metrics' },
            ].map(f => (
              <div key={f.title} className="glass-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{f.icon}</div>
                <h3 style={{ fontSize: '0.88rem', marginBottom: 4, color: '#8DD8FF' }}>{f.title}</h3>
                <p style={{ fontSize: '0.76rem', color: '#8BA8C4', lineHeight: 1.4 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hotspot Table */}
        <div className="glass-card fade-in" style={{ marginBottom: 48 }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔥 Bengaluru Pollution Hotspots
            <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.7rem' }}>Live</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {BENGALURU_HOTSPOT_PREVIEW.sort((a, b) => b.aqi - a.aqi).map((h, i) => {
              const level = getAqiLevel(h.aqi);
              return (
                <div
                  key={h.name}
                  className="glass-card"
                  style={{ padding: '12px 14px', cursor: 'pointer', borderColor: i < 3 ? level.border : 'var(--border)' }}
                  onClick={() => handleQuickPick(h.name)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.82rem', color: '#DBEAFE', fontWeight: 600 }}>{h.name}</span>
                    <span style={{ color: level.color, fontWeight: 800, fontSize: '1.1rem' }}>{h.aqi}</span>
                  </div>
                  <span className="badge" style={{ marginTop: 6, background: level.bg, color: level.color, border: `1px solid ${level.border}`, fontSize: '0.68rem' }}>
                    {level.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
