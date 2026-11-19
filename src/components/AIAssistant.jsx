import { useState, useRef, useEffect } from 'react';
import { generate, getActiveProvider, providerMeta, PROVIDERS } from '../services/aiService';

function DemoRuleEngine(msg, ctx) {
  const q = msg.toLowerCase();
  const aqi = ctx?.aqi || 0;
  const loc = ctx?.location || ctx?.city || 'this area';
  if (q.includes('aqi') || q.includes('air quality')) return `The current AQI at ${loc} is ${aqi}. ${aqi > 200 ? '⚠️ This is in the POOR category — health risk for all.' : aqi > 100 ? '🟡 Moderate level — sensitive groups should take precautions.' : '🟢 Acceptable levels for most people.'}`;
  if (q.includes('pm2.5') || q.includes('pm 2.5')) return `PM2.5 at ${loc} is ${ctx?.pm25 || 'N/A'} μg/m³. The CPCB standard is 60 μg/m³. ${(ctx?.pm25 || 0) > 60 ? '⚠️ This exceeds safe limits — use an N95 mask outdoors.' : '✅ Within acceptable range.'}`;
  if (q.includes('health') || q.includes('safe')) return `Based on AQI ${aqi} at ${loc}: ${aqi > 200 ? 'Stay indoors, wear N95 mask if going out, avoid strenuous activity.' : aqi > 100 ? 'Sensitive groups (children, elderly, asthma) should limit outdoor time. Others can go out with precautions.' : 'Air quality is acceptable. Standard precautions apply.'}`;
  if (q.includes('source') || q.includes('cause') || q.includes('why')) return `Major pollution sources in ${loc}: 1) Vehicular emissions (peak hours 7–10am, 5–9pm), 2) Industrial emissions from nearby areas, 3) Construction dust, 4) Road dust. Bengaluru's expanding IT corridors and traffic are primary contributors.`;
  if (q.includes('mask') || q.includes('n95')) return `For AQI ${aqi}: ${aqi > 150 ? '🔴 N95 or N99 mask strongly recommended for all outdoor activities.' : aqi > 100 ? '🟡 Mask recommended for sensitive groups (children, elderly, respiratory conditions).' : '🟢 Mask optional for healthy adults.'}`;
  if (q.includes('time') || q.includes('when') || q.includes('best')) return `Best times to go out in Bengaluru: 11:00 AM – 3:00 PM (after morning rush, before evening traffic). Worst times: 7:00–10:00 AM and 5:00–9:00 PM. Current AQI at ${loc}: ${aqi}.`;
  if (q.includes('route') || q.includes('travel') || q.includes('commute')) return `For travel in Bengaluru: 1) Use Namma Metro where available — 40–60% less pollution than road. 2) Avoid Silk Board, ORR, KR Puram, Peenya during peak hours. 3) If driving, use AC with recirculation mode. 4) Travel off-peak when possible.`;
  if (q.includes('weather') || q.includes('wind') || q.includes('rain')) return `Weather impacts air quality significantly. Rain reduces PM2.5 by 30–50%. Strong winds (>10 m/s) disperse pollutants. Calm days with low winds trap pollutants near ground. ${ctx?.windSpeed ? `Current wind: ${ctx.windSpeed} m/s — ${ctx.windSpeed < 3 ? 'Stagnant, pollutants accumulating' : ctx.windSpeed > 10 ? 'Good dispersal' : 'Moderate dispersal'}.` : ''}`;
  if (q.includes('peenya') || q.includes('industrial')) return `Peenya Industrial Area is Bengaluru's highest-pollution zone (AQI typically 180–220). Heavy industries, truck traffic on Tumkur Road, and lack of green buffer contribute to severe pollution. CPCB has issued multiple notices to industries here.`;
  if (q.includes('electronic city') || q.includes('ec')) return `Electronic City has moderate-high pollution (AQI 130–165) primarily from IT employee traffic (100,000+ daily commuters), flyover construction phases, and Hosur Road congestion. Best commute: Namma Metro or company buses.`;
  if (q.includes('hello') || q.includes('hi')) return `Hello! I'm AI AirGuard, your Bengaluru environmental intelligence assistant. ${ctx ? `I have data for ${loc} (AQI: ${aqi}).` : 'Search a location to get started.'} Ask me about AQI levels, health precautions, pollution sources, or safe routes.`;
  return `I'm your AI AirGuard assistant for Bengaluru air quality. ${ctx ? `Current data for ${loc}: AQI ${aqi} (${ctx.aqiLabel || 'check dashboard'}).` : 'Search a Bengaluru location first to get location-specific insights.'} You can ask about:\n• Health precautions and masks\n• Pollution sources and hotspots\n• Best travel times and routes\n• Specific pollutants (PM2.5, NO2, etc.)`;
}

export default function AIAssistant({ data }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: `👋 Hello! I'm **AI AirGuard**, powered by **IBM Granite**. ${data ? `I have air quality data for **${data.location || data.city}** (AQI: ${data.aqi}).` : 'Search a Bengaluru location to get location-specific insights.'}\n\nAsk me anything about Bengaluru air quality, health precautions, pollution sources, or safe travel routes.`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const currentProvider = getActiveProvider();
  const meta = providerMeta[currentProvider] || providerMeta[PROVIDERS.DEMO];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].filter(m => m.role !== 'system');
      const ctx = data ? { location: data.location || data.city, aqi: data.aqi, aqiLabel: data.aqiLabel, pm25: data.pm25, windSpeed: data.windSpeed } : null;
      const res = await generate(history, ctx);
      const responseText = res?.text || DemoRuleEngine(text, ctx);
      setMessages(prev => [...prev, { role: 'assistant', text: responseText, timestamp: new Date(), provider: res?.provider }]);
    } catch {
      const ctx = data ? { location: data.location || data.city, aqi: data.aqi, pm25: data.pm25 } : null;
      setMessages(prev => [...prev, { role: 'assistant', text: DemoRuleEngine(text, ctx), timestamp: new Date(), provider: 'demo' }]);
    } finally {
      setLoading(false);
    }
  }

  const QUICK_QUESTIONS = [
    'What is the current AQI?',
    'Is it safe to go outside?',
    'What mask should I wear?',
    'What are the main pollution sources?',
    'Best time to travel in Bengaluru?',
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 className="section-title">🤖 AI Assistant</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', color: meta.color }}>
            {meta.icon} Active: {meta.label}
          </span>
          <span style={{ color: '#35516D' }}>·</span>
          <span style={{ fontSize: '0.78rem', color: '#8BA8C4' }}>{meta.model}</span>
          {currentProvider === 'demo' && (
            <span className="demo-badge">Rule-based fallback · Backend unavailable</span>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 580 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: m.role === 'user' ? 'rgba(56,189,248,0.2)' : 'rgba(141,216,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              }}>
                {m.role === 'user' ? '👤' : '🤖'}
              </div>
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: 12,
                background: m.role === 'user' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${m.role === 'user' ? 'rgba(56,189,248,0.3)' : 'rgba(53,81,109,0.4)'}`,
              }}>
                <p style={{ color: '#DBEAFE', fontSize: '0.88rem', lineHeight: 1.65, whiteSpace: 'pre-line', margin: 0 }}>{m.text}</p>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#8BA8C4', fontSize: '0.68rem' }}>{m.timestamp?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {m.provider && m.provider !== 'demo' && <span style={{ color: '#38BDF8', fontSize: '0.65rem' }}>via {m.provider}</span>}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(141,216,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
              <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(53,81,109,0.4)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8', animation: `pulse 1s ${i*0.2}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick questions */}
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_QUESTIONS.map(q => (
            <button key={q} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => { setInput(q); }} disabled={loading}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '0 20px 20px' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
            <input
              className="input-field"
              placeholder="Ask about Bengaluru air quality, health, routes…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
