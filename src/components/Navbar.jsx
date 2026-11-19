import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'home',       label: 'Home',          icon: '🏠' },
  { id: 'dashboard',  label: 'Dashboard',     icon: '📊' },
  { id: 'map',        label: 'Live Map',      icon: '🗺️' },
  { id: 'journey',    label: 'AirSafe',       icon: '🚗' },
  { id: 'charts',     label: 'Trends',        icon: '📈' },
  { id: 'alerts',     label: 'Alerts',        icon: '🚨' },
  { id: 'assistant',  label: 'AI Chat',       icon: '🤖' },
  { id: 'agents',     label: 'Agents',        icon: '⚙️' },
  { id: 'simulator',  label: 'Simulator',     icon: '🔬' },
  { id: 'guardrails', label: 'Guardrails',    icon: '🛡️' },
  { id: 'evaluation', label: 'Evaluation',    icon: '📋' },
  { id: 'report',     label: 'Report',        icon: '📝' },
];

export default function Navbar({ activeSection, onNavigate, hasData }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(15,30,50,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(53,81,109,0.6)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 64 }}>
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => onNavigate('home')}
        >
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

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto', flexWrap: 'nowrap', overflow: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;
            const needsData = ['dashboard', 'charts', 'alerts'].includes(item.id);
            const disabled = needsData && !hasData;
            return (
              <button
                key={item.id}
                onClick={() => !disabled && onNavigate(item.id)}
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
                <span style={{ '@media(max-width:1024px)': { display: 'none' } }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
