import { useState } from 'react';
import '../styles/navbar.css';

const NAV_LINKS = [
  { id: 'home',       label: 'Home' },
  { id: 'dashboard',  label: 'Dashboard' },
  { id: 'charts',     label: 'AQI Charts' },
  { id: 'assistant',  label: 'AI Assistant' },
  { id: 'insights',   label: 'Insights' },
];

export default function Navbar({ activeSection, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar glass-card">
      <div className="navbar-inner container">
        <button className="navbar-logo" onClick={() => onNavigate('home')}>
          <span className="logo-icon">🌬️</span>
          <span className="logo-text">
            AI <span className="logo-accent">AirGuard</span>
          </span>
        </button>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <button
                className={`nav-link ${activeSection === link.id ? 'active' : ''}`}
                onClick={() => { onNavigate(link.id); setMenuOpen(false); }}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
