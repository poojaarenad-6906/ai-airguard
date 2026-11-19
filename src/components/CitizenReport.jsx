import { useState } from 'react';

const POLLUTION_TYPES = [
  { id: 'construction', label: 'Construction Dust', icon: '🏗️' },
  { id: 'smoke', label: 'Smoke / Burning', icon: '🔥' },
  { id: 'road-dust', label: 'Road Dust', icon: '🌫️' },
  { id: 'industrial', label: 'Industrial Emissions', icon: '🏭' },
  { id: 'sewage', label: 'Sewage / Waste Burning', icon: '🗑️' },
  { id: 'vehicle', label: 'Vehicle Idling', icon: '🚌' },
];

export default function CitizenReport() {
  const [form, setForm] = useState({ location: '', type: '', description: '', severity: 3 });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.location || !form.type) return;
    setSubmitting(true);
    // Simulate submission
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: 48, borderColor: 'rgba(34,197,94,0.3)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#22C55E', marginBottom: 12 }}>Report Submitted!</h2>
        <p style={{ color: '#DBEAFE', marginBottom: 8 }}>Your pollution report has been recorded and will be reviewed by environmental authorities.</p>
        <p style={{ color: '#8BA8C4', fontSize: '0.85rem', marginBottom: 24 }}>Reference ID: RPT-{Date.now().toString(36).toUpperCase()}</p>
        <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ location: '', type: '', description: '', severity: 3 }); }}>
          Submit Another Report
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">📝 Citizen Pollution Report</h2>
        <p className="section-subtitle">Report visible pollution in your area to help environmental authorities take action</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <form onSubmit={handleSubmit}>
            <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>📍 Location</h3>
              <input className="input-field" placeholder="Enter Bengaluru area/landmark" value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required />
            </div>

            <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>🏷️ Pollution Type</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {POLLUTION_TYPES.map(t => (
                  <div key={t.id} onClick={() => setForm(p => ({ ...p, type: t.id }))}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      background: form.type === t.id ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.type === t.id ? 'rgba(56,189,248,0.4)' : 'rgba(53,81,109,0.3)'}`,
                      display: 'flex', gap: 8, alignItems: 'center', transition: 'all 0.2s',
                    }}>
                    <span>{t.icon}</span>
                    <span style={{ color: form.type === t.id ? '#38BDF8' : '#DBEAFE', fontSize: '0.82rem', fontWeight: form.type === t.id ? 700 : 400 }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>📊 Severity: {form.severity}/5</h3>
              <input type="range" min={1} max={5} value={form.severity}
                onChange={e => setForm(p => ({ ...p, severity: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#38BDF8' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8BA8C4', marginTop: 4 }}>
                <span>Mild</span><span>Moderate</span><span>Severe</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>📝 Description</h3>
              <textarea className="input-field" placeholder="Describe what you observe…" rows={4}
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting || !form.location || !form.type}>
              {submitting ? <><span className="spinner-sm" /> Submitting…</> : <>📤 Submit Pollution Report</>}
            </button>
          </form>
        </div>

        <div>
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>📌 Recent Reports (Demo)</h3>
            {[
              { loc: 'Peenya Industrial Area', type: 'Industrial Emissions', severity: 5, time: '15 min ago' },
              { loc: 'Bellandur Lake Road', type: 'Sewage / Waste Burning', severity: 4, time: '1 hour ago' },
              { loc: 'Marathahalli Bridge', type: 'Vehicle Idling', severity: 3, time: '2 hours ago' },
              { loc: 'ORR Sarjapur Exit', type: 'Construction Dust', severity: 3, time: '3 hours ago' },
              { loc: 'KR Puram Station Road', type: 'Road Dust', severity: 2, time: '4 hours ago' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '10px', marginBottom: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${r.severity >= 4 ? '#EF4444' : r.severity >= 3 ? '#EAB308' : '#22C55E'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#DBEAFE', fontSize: '0.85rem', fontWeight: 600 }}>{r.loc}</span>
                  <span style={{ color: '#8BA8C4', fontSize: '0.72rem' }}>{r.time}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#8BA8C4', fontSize: '0.78rem' }}>{r.type}</span>
                  <span style={{ marginLeft: 'auto', color: r.severity >= 4 ? '#EF4444' : r.severity >= 3 ? '#EAB308' : '#22C55E', fontSize: '0.75rem', fontWeight: 700 }}>
                    {'★'.repeat(r.severity)}{'☆'.repeat(5 - r.severity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: 20, background: 'rgba(56,189,248,0.05)', borderColor: 'rgba(56,189,248,0.2)' }}>
            <h3 style={{ fontSize: '0.88rem', marginBottom: 10, color: '#38BDF8' }}>ℹ️ How Reports Help</h3>
            <ul style={{ color: '#DBEAFE', fontSize: '0.8rem', lineHeight: 1.8, paddingLeft: 16 }}>
              <li>Reports trigger AI monitoring agent alerts</li>
              <li>Environmental authorities are notified</li>
              <li>High-severity reports escalated within 1 hour</li>
              <li>Data feeds into pollution hotspot analysis</li>
              <li>Anonymous — no personal data stored</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
