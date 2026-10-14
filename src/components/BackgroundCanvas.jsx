import { useEffect, useRef } from 'react';
import '../styles/background.css';

const PARTICLE_COUNT = 18;

export default function BackgroundCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const left = Math.random() * 100;
      const duration = 8 + Math.random() * 14;
      const delay = Math.random() * 12;
      const size = 1 + Math.random() * 2;
      p.style.cssText = `left:${left}%;width:${size}px;height:${size}px;animation-duration:${duration}s;animation-delay:-${delay}s;`;
      container.appendChild(p);
      particles.push(p);
    }
    return () => particles.forEach((p) => p.remove());
  }, []);

  return (
    <div className="bg-canvas">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />
      <div className="lightning-container">
        <div className="lightning" />
        <div className="lightning" />
        <div className="lightning" />
        <div className="lightning" />
      </div>
      <div ref={containerRef} />
    </div>
  );
}
