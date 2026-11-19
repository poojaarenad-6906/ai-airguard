import { useState, useEffect } from 'react';
import { login, register, forgotPassword, resetPassword } from '../services/authService';

const INPUT = {
  background: 'var(--card-dark)', color: 'var(--text)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '11px 16px', fontSize: '0.95rem', width: '100%',
  transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none',
};
const INPUT_FOCUS = { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px rgba(56,189,248,0.15)' };

function Field({ label, type = 'text', value, onChange, placeholder, required, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', color: '#8BA8C4', fontSize: '0.82rem', marginBottom: 5, fontWeight: 600 }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        style={{ ...INPUT, ...(focused ? INPUT_FOCUS : {}) }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </div>
  );
}

// ═══════════════ LOGIN ═══════════════

function LoginForm({ onSuccess, onForgot, onSwitchToRegister }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      const user = await login(email, password);
      onSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Email Address" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" required autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword}
        placeholder="Your password" required autoComplete="current-password" />

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.85rem', marginBottom: 14 }}>
          ❌ {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
        {loading ? <><span className="spinner-sm" /> Signing in…</> : '🔐 Sign In'}
      </button>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <button type="button" onClick={onForgot}
          style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
          Forgot password?
        </button>
      </div>

      <div style={{ textAlign: 'center', color: '#8BA8C4', fontSize: '0.85rem' }}>
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister}
          style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
          Create account
        </button>
      </div>
    </form>
  );
}

// ═══════════════ REGISTER ═══════════════

function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', city: 'Bengaluru', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = k => v => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      const user = await register(form);
      onSuccess(user);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Full Name" value={form.fullName} onChange={set('fullName')} placeholder="Your full name" required autoComplete="name" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />
        <Field label="Phone Number" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" autoComplete="tel" />
      </div>
      <Field label="Location / City" value={form.city} onChange={set('city')} placeholder="e.g. Bengaluru, HSR Layout" autoComplete="address-level2" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required autoComplete="new-password" />
        <Field label="Confirm Password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required autoComplete="new-password" />
      </div>

      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.06)',
        border: '1px solid rgba(56,189,248,0.2)', fontSize: '0.78rem', color: '#8BA8C4', marginBottom: 14 }}>
        🛡️ Your password is securely hashed. We never store plain-text passwords.
        By registering you consent to receiving pollution alert emails. You can disable these anytime.
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.85rem', marginBottom: 14 }}>
          ❌ {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
        {loading ? <><span className="spinner-sm" /> Creating account…</> : '✨ Create Account'}
      </button>

      <div style={{ textAlign: 'center', color: '#8BA8C4', fontSize: '0.85rem' }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin}
          style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
          Sign in
        </button>
      </div>
    </form>
  );
}

// ═══════════════ RESET PASSWORD (from email link) ═══════════════

function ResetPasswordForm({ token, onBack }) {
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]               = useState(false);
  const [done, setDone]                     = useState(false);
  const [error, setError]                   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(token, newPassword);
      // Clear the URL param after success
      window.history.replaceState({}, '', window.location.pathname);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
        <h3 style={{ marginBottom: 10, color: '#8DD8FF' }}>Password Reset!</h3>
        <p style={{ color: '#8BA8C4', fontSize: '0.88rem', marginBottom: 20 }}>
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <button className="btn btn-primary" onClick={onBack} style={{ width: '100%' }}>🔐 Sign In Now</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', fontSize: '0.82rem', color: '#8BA8C4', marginBottom: 16 }}>
        🔑 Enter your new password below. The reset link is valid for 1 hour.
      </div>
      <Field label="New Password" type="password" value={newPassword} onChange={setNewPassword}
        placeholder="Min. 8 characters" required autoComplete="new-password" />
      <Field label="Confirm New Password" type="password" value={confirmPassword} onChange={setConfirmPassword}
        placeholder="Repeat new password" required autoComplete="new-password" />

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.85rem', marginBottom: 14 }}>
          ❌ {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
        {loading ? <><span className="spinner-sm" /> Resetting…</> : '🔐 Reset Password'}
      </button>
      <div style={{ textAlign: 'center' }}>
        <button type="button" onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#8BA8C4', fontSize: '0.85rem', cursor: 'pointer' }}>
          ← Back to Sign In
        </button>
      </div>
    </form>
  );
}

// ═══════════════ FORGOT PASSWORD ═══════════════

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed. Please try again.');
    } finally { setLoading(false); }
  }

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📧</div>
        <h3 style={{ marginBottom: 10, color: '#8DD8FF' }}>Check Your Email</h3>
        <p style={{ color: '#8BA8C4', fontSize: '0.88rem', marginBottom: 20 }}>
          If an account exists for <strong style={{ color: '#fff' }}>{email}</strong>, a password reset link has been sent.
        </p>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Sign In</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ color: '#8BA8C4', fontSize: '0.88rem', marginBottom: 18 }}>
        Enter your registered email address and we'll send you a password reset link.
      </p>
      <Field label="Email Address" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" required autoComplete="email" />

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.85rem', marginBottom: 14 }}>
          ❌ {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
        {loading ? <><span className="spinner-sm" /> Sending…</> : '📧 Send Reset Link'}
      </button>
      <div style={{ textAlign: 'center' }}>
        <button type="button" onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#8BA8C4', fontSize: '0.85rem', cursor: 'pointer' }}>
          ← Back to Sign In
        </button>
      </div>
    </form>
  );
}

// ═══════════════ AUTH MODAL ═══════════════

export default function AuthModal({ onSuccess, onClose, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab); // 'login' | 'register' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState('');

  // On mount, check URL for reset_token and switch to reset tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setResetToken(token);
      setTab('reset');
    }
  }, []);

  const titles = {
    login:    { icon: '🔐', title: 'Welcome Back', sub: 'Sign in to your AI AirGuard account' },
    register: { icon: '✨', title: 'Create Account', sub: 'Join AI AirGuard for personalised alerts' },
    forgot:   { icon: '🔑', title: 'Reset Password', sub: "We'll send a reset link to your email" },
    reset:    { icon: '🔐', title: 'Set New Password', sub: 'Create a new secure password for your account' },
  };
  const { icon, title, sub } = titles[tab] || titles.login;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10,20,35,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div className="fade-in" style={{
        background: '#183B63', border: '1px solid #35516D', borderRadius: 18,
        width: '100%', maxWidth: tab === 'register' ? 560 : 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(56,189,248,0.08)',
        overflow: 'hidden',
        maxHeight: '95vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F1E32, #1a3a5c)',
          padding: '24px 28px 20px',
          borderBottom: '1px solid rgba(53,81,109,0.6)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg,#38BDF8,#0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                boxShadow: '0 0 14px rgba(56,189,248,0.4)',
              }}>🌬️</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>AI AirGuard</div>
                <div style={{ color: '#8BA8C4', fontSize: '0.65rem' }}>Bengaluru · IBM Granite</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{icon} {title}</h2>
              <p style={{ color: '#8BA8C4', fontSize: '0.82rem', margin: '3px 0 0' }}>{sub}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#8BA8C4', cursor: 'pointer', fontSize: '1.3rem', padding: '2px 6px', borderRadius: 6, lineHeight: 1 }}>
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {tab === 'login'    && <LoginForm onSuccess={onSuccess} onForgot={() => setTab('forgot')} onSwitchToRegister={() => setTab('register')} />}
          {tab === 'register' && <RegisterForm onSuccess={onSuccess} onSwitchToLogin={() => setTab('login')} />}
          {tab === 'forgot'   && <ForgotPasswordForm onBack={() => setTab('login')} />}
          {tab === 'reset'    && <ResetPasswordForm token={resetToken} onBack={() => setTab('login')} />}
        </div>
      </div>
    </div>
  );
}
