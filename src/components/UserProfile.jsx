import { useState, useEffect } from 'react';
import { updateProfile, fetchAlertHistory } from '../services/authService';
import { getAqiLevel } from '../utils/aqiHelpers';

const BLR_CITIES = [
  'Bengaluru', 'Koramangala', 'Whitefield', 'Electronic City', 'HSR Layout',
  'Indiranagar', 'Jayanagar', 'BTM Layout', 'Marathahalli', 'Hebbal',
  'Peenya', 'Yelahanka', 'Manyata Tech Park', 'KR Puram', 'Bellandur',
  'Sarjapur', 'JP Nagar', 'Banashankari', 'Rajajinagar', 'Yeshwanthpur',
];

const AQI_THRESHOLDS = [
  { value: 100, label: '100 — Satisfactory (notify me when moderate+)' },
  { value: 150, label: '150 — Moderate (default)' },
  { value: 200, label: '200 — Poor (notify only when poor+)' },
  { value: 300, label: '300 — Very Poor only' },
];

function InputRow({ label, value, onChange, type = 'text', placeholder, options }) {
  const [focused, setFocused] = useState(false);
  if (options) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', color: '#8BA8C4', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ background: '#0d2847', color: '#fff', border: `1px solid ${focused ? '#38BDF8' : '#35516D'}`, borderRadius: 8, padding: '10px 14px', fontSize: '0.9rem', width: '100%', outline: 'none' }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
          {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', color: '#8BA8C4', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: '#0d2847', color: '#fff', border: `1px solid ${focused ? '#38BDF8' : '#35516D'}`, borderRadius: 8, padding: '10px 16px', fontSize: '0.9rem', width: '100%', outline: 'none', transition: 'border 0.2s', boxShadow: focused ? '0 0 0 3px rgba(56,189,248,0.15)' : 'none' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </div>
  );
}

export default function UserProfile({ user, onUpdate, onClose }) {
  const [tab, setTab]           = useState('profile');
  const [form, setForm]         = useState({ fullName: user.full_name || '', phone: user.phone || '', city: user.city || 'Bengaluru' });
  const [notify, setNotify]     = useState({ notifyEnabled: user.notify_enabled ?? 1, notifyThreshold: user.notify_threshold ?? 150 });
  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '', confirmNew: '' });
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ type: '', text: '' });
  const [alerts, setAlerts]     = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const set = k => v => setForm(p => ({ ...p, [k]: v }));
  const setN = k => v => setNotify(p => ({ ...p, [k]: v }));
  const setPw = k => v => setPwForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (tab === 'alerts') loadAlerts();
  }, [tab]);

  async function loadAlerts() {
    setAlertsLoading(true);
    try { setAlerts(await fetchAlertHistory()); }
    catch { setAlerts([]); }
    finally { setAlertsLoading(false); }
  }

  async function saveProfile() {
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      const updated = await updateProfile({ ...form, ...notify });
      onUpdate(updated);
      setMsg({ type: 'success', text: '✅ Profile updated successfully.' });
    } catch (e) { setMsg({ type: 'error', text: `❌ ${e.message}` }); }
    finally { setSaving(false); }
  }

  async function savePassword() {
    if (pwForm.newPassword !== pwForm.confirmNew) { setMsg({ type: 'error', text: '❌ New passwords do not match.' }); return; }
    if (pwForm.newPassword.length < 8) { setMsg({ type: 'error', text: '❌ Password must be at least 8 characters.' }); return; }
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      await updateProfile({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmNew: '' });
      setMsg({ type: 'success', text: '✅ Password changed successfully.' });
    } catch (e) { setMsg({ type: 'error', text: `❌ ${e.message}` }); }
    finally { setSaving(false); }
  }

  const TABS = [
    { id: 'profile',   label: '👤 Profile' },
    { id: 'account',   label: '🏷️ Account' },
    { id: 'alerts_pref', label: '🔔 Notifications' },
    { id: 'password',  label: '🔐 Password' },
    { id: 'alerts',    label: '📜 Alert History' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(10,20,35,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="fade-in" style={{ background: '#183B63', border: '1px solid #35516D', borderRadius: 18, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0F1E32,#1a3a5c)', padding: '20px 24px', borderBottom: '1px solid rgba(53,81,109,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#38BDF8,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: '#0F1E32', flexShrink: 0 }}>
              {(user.full_name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{user.full_name}</div>
              <div style={{ color: '#8BA8C4', fontSize: '0.78rem' }}>{user.email}</div>
              <div style={{ color: '#38BDF8', fontSize: '0.72rem', marginTop: 2 }}>📍 {user.city || 'Bengaluru'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8BA8C4', cursor: 'pointer', fontSize: '1.3rem', padding: '2px 8px', borderRadius: 6 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #35516D', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg({ type: '', text: '' }); }}
              style={{ padding: '12px 18px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#38BDF8' : 'transparent'}`, color: tab === t.id ? '#38BDF8' : '#8BA8C4', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '22px 24px' }}>
          {msg.text && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem',
              background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: msg.type === 'success' ? '#22C55E' : '#EF4444' }}>
              {msg.text}
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <div>
              <InputRow label="Full Name" value={form.fullName} onChange={set('fullName')} placeholder="Your full name" />
              <InputRow label="Phone Number" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              <InputRow label="Preferred Location / City" value={form.city} onChange={set('city')} placeholder="e.g. Bengaluru" options={BLR_CITIES} />
              <p style={{ color: '#8BA8C4', fontSize: '0.78rem', marginBottom: 16 }}>
                📍 Your preferred location is used to personalise AQI data and pollution alerts.
              </p>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ width: '100%' }}>
                {saving ? <><span className="spinner-sm" /> Saving…</> : '💾 Save Profile'}
              </button>
            </div>
          )}

          {/* Notification preferences */}
          {tab === 'alerts_pref' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, background: '#0d2847', border: '1px solid #35516D', marginBottom: 14 }}>
                <div>
                  <div style={{ color: '#DBEAFE', fontWeight: 600, fontSize: '0.9rem' }}>📧 Email Pollution Alerts</div>
                  <div style={{ color: '#8BA8C4', fontSize: '0.78rem', marginTop: 3 }}>Receive email when AQI in your city exceeds threshold</div>
                </div>
                <div onClick={() => setN('notifyEnabled')(notify.notifyEnabled ? 0 : 1)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: notify.notifyEnabled ? '#38BDF8' : '#35516D', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: notify.notifyEnabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </div>

              {notify.notifyEnabled ? (
                <>
                  <InputRow label="Alert AQI Threshold" value={String(notify.notifyThreshold)} onChange={v => setN('notifyThreshold')(Number(v))} options={AQI_THRESHOLDS} />
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', fontSize: '0.78rem', color: '#8BA8C4', marginBottom: 16 }}>
                    💡 Alerts are rate-limited to once every 4 hours per location to avoid inbox flooding.
                  </div>
                </>
              ) : (
                <p style={{ color: '#8BA8C4', fontSize: '0.85rem', marginBottom: 16 }}>
                  Email notifications are disabled. Enable them above to receive pollution alerts.
                </p>
              )}

              <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ width: '100%' }}>
                {saving ? <><span className="spinner-sm" /> Saving…</> : '💾 Save Preferences'}
              </button>
            </div>
          )}

          {/* Password tab */}
          {tab === 'password' && (
            <div>
              <InputRow label="Current Password" type="password" value={pwForm.currentPassword} onChange={setPw('currentPassword')} placeholder="Your current password" />
              <InputRow label="New Password" type="password" value={pwForm.newPassword} onChange={setPw('newPassword')} placeholder="Min. 8 characters" />
              <InputRow label="Confirm New Password" type="password" value={pwForm.confirmNew} onChange={setPw('confirmNew')} placeholder="Repeat new password" />
              <button className="btn btn-primary" onClick={savePassword} disabled={saving} style={{ width: '100%' }}>
                {saving ? <><span className="spinner-sm" /> Updating…</> : '🔐 Update Password'}
              </button>
            </div>
          )}

          {/* Account details tab */}
          {tab === 'account' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#8DD8FF', fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>🏷️ Account Details</div>
                {/* Email — read-only */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: '#8BA8C4', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Email Address</label>
                  <div style={{ background: '#0d2847', border: '1px solid #35516D', borderRadius: 8, padding: '10px 16px', fontSize: '0.9rem', color: '#DBEAFE', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📧</span>
                    <span>{user.email}</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', color: '#38BDF8', fontWeight: 700 }}>VERIFIED</span>
                  </div>
                  <p style={{ color: '#8BA8C4', fontSize: '0.75rem', marginTop: 5 }}>Email address cannot be changed. Contact support if needed.</p>
                </div>

                {/* Phone — read-only display */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: '#8BA8C4', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Phone Number</label>
                  <div style={{ background: '#0d2847', border: '1px solid #35516D', borderRadius: 8, padding: '10px 16px', fontSize: '0.9rem', color: user.phone ? '#DBEAFE' : '#4A6682', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📱</span>
                    <span>{user.phone || 'Not set — add it in the Profile tab'}</span>
                  </div>
                </div>

                {/* Member since */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: '#8BA8C4', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Member Since</label>
                  <div style={{ background: '#0d2847', border: '1px solid #35516D', borderRadius: 8, padding: '10px 16px', fontSize: '0.9rem', color: '#DBEAFE', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📅</span>
                    <span>{user.created_at ? new Date(user.created_at + (user.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>

                {/* Preferred city */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: '#8BA8C4', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>Preferred City</label>
                  <div style={{ background: '#0d2847', border: '1px solid #35516D', borderRadius: 8, padding: '10px 16px', fontSize: '0.9rem', color: '#DBEAFE', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📍</span>
                    <span>{user.city || 'Bengaluru'}</span>
                  </div>
                </div>
              </div>

              {/* Account stats */}
              <div style={{ color: '#8DD8FF', fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>📊 Account Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Notifications', value: user.notify_enabled ? '✅ Enabled' : '❌ Disabled', icon: '🔔' },
                  { label: 'Alert Threshold', value: `AQI ≥ ${user.notify_threshold ?? 150}`, icon: '⚠️' },
                  { label: 'Account Type', value: 'Free', icon: '🏷️' },
                  { label: 'AI Model', value: 'IBM Granite', icon: '🤖' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#0d2847', border: '1px solid #35516D', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ color: '#8BA8C4', fontSize: '0.75rem', marginBottom: 4 }}>{stat.icon} {stat.label}</div>
                    <div style={{ color: '#DBEAFE', fontWeight: 700, fontSize: '0.88rem' }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', fontSize: '0.78rem', color: '#8BA8C4' }}>
                🛡️ Your data is stored securely and never shared. Passwords are bcrypt-hashed. JWT tokens expire after 7 days.
              </div>
            </div>
          )}

          {/* Alert history tab */}
          {tab === 'alerts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: '#8DD8FF', fontWeight: 700 }}>📜 Alert History</span>
                <button className="btn btn-ghost btn-sm" onClick={loadAlerts}>🔄 Refresh</button>
              </div>
              {alertsLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#8BA8C4' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                  <p>No pollution alerts sent yet.</p>
                  <p style={{ fontSize: '0.78rem', marginTop: 6 }}>Alerts are triggered when your city's AQI exceeds your threshold.</p>
                </div>
              ) : (
                alerts.map(a => {
                  const level = getAqiLevel(a.aqi);
                  return (
                    <div key={a.id} style={{ padding: '12px 14px', borderRadius: 8, background: '#0d2847', border: `1px solid ${level.border}`, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ color: level.color, fontWeight: 700, fontSize: '0.88rem' }}>AQI {a.aqi} — {a.category}</span>
                        <span className="badge" style={{ background: level.bg, color: level.color, border: `1px solid ${level.border}`, fontSize: '0.68rem' }}>{level.label}</span>
                      </div>
                      <div style={{ color: '#DBEAFE', fontSize: '0.82rem' }}>📍 {a.location}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ color: '#8BA8C4', fontSize: '0.72rem' }}>{new Date(a.created_at + 'Z').toLocaleString()}</span>
                        {a.email_sent ? <span style={{ color: '#22C55E', fontSize: '0.72rem' }}>📧 Email sent</span> : <span style={{ color: '#8BA8C4', fontSize: '0.72rem' }}>📋 Logged only</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
