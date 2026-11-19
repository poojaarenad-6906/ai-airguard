/**
 * AI AirGuard — Auth Service
 * All auth calls go through the Flask backend.
 * JWT token is stored in localStorage for session persistence.
 * API keys and passwords are NEVER handled in this file.
 */

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const TOKEN_KEY = 'airguard_token';
const USER_KEY  = 'airguard_user';

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

function _saveSession(user, token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function _clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function _authHeaders() {
  const t = getToken();
  return t ? { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
           : { 'Content-Type': 'application/json' };
}

async function _post(path, body) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'POST',
    headers: _authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'Request failed');
  return d;
}

async function _get(path) {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: _authHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'Request failed');
  return d;
}

async function _put(path, body) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'PUT',
    headers: _authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'Request failed');
  return d;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export async function register(formData) {
  const d = await _post('/api/auth/register', formData);
  _saveSession(d.user, d.token);
  return d.user;
}

export async function login(email, password) {
  const d = await _post('/api/auth/login', { email, password });
  _saveSession(d.user, d.token);
  return d.user;
}

export function logout() {
  _clearSession();
}

export async function fetchMe() {
  const d = await _get('/api/auth/me');
  if (d.user) localStorage.setItem(USER_KEY, JSON.stringify(d.user));
  return d.user;
}

export async function updateProfile(data) {
  const d = await _put('/api/auth/profile', data);
  if (d.user) localStorage.setItem(USER_KEY, JSON.stringify(d.user));
  return d.user;
}

export async function forgotPassword(email) {
  return _post('/api/auth/forgot-password', { email });
}

export async function resetPassword(token, newPassword) {
  return _post('/api/auth/reset-password', { token, newPassword });
}

export async function fetchAlertHistory() {
  const d = await _get('/api/auth/alerts');
  return d.alerts || [];
}

export async function checkAndTriggerAlerts(locationData) {
  try {
    await _post('/api/auth/check-alerts', {
      location: locationData.location || locationData.city,
      aqi: locationData.aqi,
      category: locationData.aqiCategory || '',
    });
  } catch { /* non-critical — silently fail */ }
}
