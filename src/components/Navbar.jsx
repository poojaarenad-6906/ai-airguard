import { useState, useRef, useEffect } from 'react';

const NAV_ITEMS = [
  { id: 'home',       label: 'Home',       icon: '🏠' },
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { id: 'map',        label: 'Live Map',   icon: '🗺️' },
  { id: 'journey',    label: 'AirSafe',    icon: '🚗' },
  { id: 'charts',     label: 'Trends',     icon: '📈' },
  { id: 'alerts',     label: 'Alerts',     icon: '🚨' },
  { id: 'assistant',  label: 'AI Chat',    icon: '🤖' },
  { id: 'agents',     label: 'Agents',     icon: '⚙️' },
  { id: 'simulator',  label: 'Simulator',  icon: '🔬' },
  { id: 'guardrails', label: 'Guardrails', icon: '🛡️' },
  { id: 'evaluation', label: 'Evaluation', icon: '📋' },
  { id: 'report',     label: 'Report',     icon: '📝' },
];

export default function Navbar({ activeSection, onNavigate, hasData, user, onLoginClick, onLogout, onProfileClick }) {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(15,30,50,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(53,81,109,0.6)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 64 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => onNavigate('home')}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #38BDF8, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', boxShadow: '0 0 12px rgba(56,189,248,0.4)',
          }}>🌬️</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>AI AirGuard</div>
            <div style={{ color: '#8BA8C4', fontSize: '0.65rem', lineHeight: 1 }}>Bengaluru · IBM Granite</div>
          </div>
        </div>

        {/* Desktop nav items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 20, flex: 1, flexWrap: 'nowrap', overflow: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive  = activeSection === item.id;
            const needsData = ['dashboard', 'charts', 'alerts'].includes(item.id);
            const disabled  = needsData && !hasData;
            return (
              <button key={item.id} onClick={() => !disabled && onNavigate(item.id)}
                style={{
                  background: isActive ? 'rgba(56,189,248,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent',
                  borderRadius: 8, padding: '5px 10px',
                  color: isActive ? '#38BDF8' : disabled ? '#35516D' : '#DBEAFE',
                  fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  opacity: disabled ? 0.4 : 1,
                }}
                onMouseEnter={e => !disabled && !isActive && (e.currentTarget.style.background = 'rgba(141,216,255,0.06)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Auth controls — right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
          {user ? (
            /* ── Profile dropdown ── */
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdown(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: profileDropdown ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.1)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                  color: '#38BDF8', fontSize: '0.82rem', fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.2)'}
                onMouseLeave={e => !profileDropdown && (e.currentTarget.style.background = 'rgba(56,189,248,0.1)')}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#38BDF8,#0ea5e9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 800, color: '#0F1E32',
                }}>
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name?.split(' ')[0] || 'Profile'}
                </span>
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{profileDropdown ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown menu */}
              {profileDropdown && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#183B63', border: '1px solid #35516D',
                  borderRadius: 10, minWidth: 200,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  overflow: 'hidden', zIndex: 2000,
                }}>
                  {/* User info header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(53,81,109,0.5)', background: 'rgba(15,30,50,0.6)' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{user.full_name}</div>
                    <div style={{ color: '#8BA8C4', fontSize: '0.75rem', marginTop: 2 }}>{user.email}</div>
                    <div style={{ color: '#38BDF8', fontSize: '0.72rem', marginTop: 2 }}>📍 {user.city || 'Bengaluru'}</div>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: '👤', label: 'My Profile', action: () => { onProfileClick(); setProfileDropdown(false); } },
                    { icon: '🔔', label: 'Notifications', action: () => { onProfileClick(); setProfileDropdown(false); } },
                    { icon: '🛡️', label: 'Guardrails', action: () => { onNavigate('guardrails'); setProfileDropdown(false); } },
                    { icon: '📋', label: 'Evaluation', action: () => { onNavigate('evaluation'); setProfileDropdown(false); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', background: 'none', border: 'none',
                        color: '#DBEAFE', fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'background 0.15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}

                  {/* Sign out */}
                  <div style={{ borderTop: '1px solid rgba(53,81,109,0.5)' }}>
                    <button onClick={() => { onLogout(); setProfileDropdown(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', background: 'none', border: 'none',
                        color: '#EF4444', fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'background 0.15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onLoginClick}
              style={{
                background: 'linear-gradient(135deg,#38BDF8,#0ea5e9)',
                border: 'none', borderRadius: 8, padding: '7px 16px',
                color: '#0F1E32', fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 10px rgba(56,189,248,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🔐 Sign In
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
