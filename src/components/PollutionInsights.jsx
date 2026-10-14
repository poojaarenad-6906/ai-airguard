import '../styles/insights.css';

const AQI_SCALE = [
  { level: 1, label: 'Good',      color: '#4CAF50', desc: 'Air quality poses little or no risk. Ideal for all outdoor activities.' },
  { level: 2, label: 'Fair',      color: '#8BC34A', desc: 'Acceptable quality. Very sensitive groups may experience minor symptoms.' },
  { level: 3, label: 'Moderate',  color: '#FFC107', desc: 'Sensitive groups should reduce prolonged outdoor exertion.' },
  { level: 4, label: 'Poor',      color: '#FF5722', desc: 'Everyone may experience effects. Reduce outdoor activities.' },
  { level: 5, label: 'Very Poor', color: '#B71C1C', desc: 'Health emergency. Avoid all outdoor exposure.' },
];

const POLLUTANTS = [
  {
    symbol: 'PM2.5', name: 'Fine Particulate Matter', icon: '💨',
    desc: 'Tiny particles ≤2.5 μm diameter. They penetrate deep into lungs and enter the bloodstream. Primary driver of AQI concern globally.',
    sources: ['Vehicle exhaust', 'Biomass burning', 'Industrial processes', 'Secondary formation from gases'],
    who: '15 μg/m³ (annual)',
  },
  {
    symbol: 'PM10', name: 'Coarse Particulate Matter', icon: '🌫️',
    desc: 'Particles ≤10 μm diameter including dust, pollen, and mould. Irritate the respiratory tract.',
    sources: ['Road dust', 'Construction sites', 'Agriculture', 'Natural dust storms'],
    who: '45 μg/m³ (annual)',
  },
  {
    symbol: 'NO₂', name: 'Nitrogen Dioxide', icon: '⚗️',
    desc: 'Reddish-brown gas. High concentrations cause respiratory inflammation and contribute to smog formation.',
    sources: ['Vehicle engines', 'Power plants', 'Industrial combustion'],
    who: '10 μg/m³ (annual)',
  },
  {
    symbol: 'O₃', name: 'Ground-level Ozone', icon: '🌀',
    desc: 'Not directly emitted — forms when NO₂ and VOCs react in sunlight. Can trigger asthma and reduce lung function.',
    sources: ['Secondary formation (sunlight + NOx + VOCs)', 'Vehicle exhaust (precursor)', 'Solvents'],
    who: '60 μg/m³ (daily)',
  },
  {
    symbol: 'CO', name: 'Carbon Monoxide', icon: '🏭',
    desc: 'Colourless, odourless gas from incomplete combustion. Impairs the blood\'s oxygen-carrying capacity.',
    sources: ['Vehicle exhaust', 'Indoor cooking fires', 'Industrial burning', 'Wildfires'],
    who: '4 mg/m³ (daily)',
  },
  {
    symbol: 'SO₂', name: 'Sulphur Dioxide', icon: '🔬',
    desc: 'Pungent gas from burning sulphur-containing fuels. Causes acid rain and aggravates respiratory conditions.',
    sources: ['Coal power stations', 'Oil refineries', 'Volcanic activity', 'Metal smelting'],
    who: '40 μg/m³ (daily)',
  },
];

const REDUCTION_TIPS = [
  { icon: '🚌', tip: 'Use public transport, walk, or cycle instead of driving.' },
  { icon: '🌱', tip: 'Plant trees and maintain indoor plants.' },
  { icon: '💡', tip: 'Switch to clean energy sources at home.' },
  { icon: '🏭', tip: 'Support policies that regulate industrial emissions.' },
  { icon: '♻️', tip: 'Reduce, reuse, and recycle to cut waste burning.' },
  { icon: '🔥', tip: 'Avoid burning wood, leaves, or crop residues.' },
  { icon: '🌬️', tip: 'Use air purifiers with HEPA filters indoors.' },
  { icon: '📱', tip: 'Monitor daily AQI and plan outdoor activities accordingly.' },
];

export default function PollutionInsights() {
  return (
    <section className="section fade-in">
      <div className="container">
        <div className="section-title">
          <h2>🌱 Pollution Insights</h2>
          <p>Understand AQI, major pollutants, their sources, and how to protect yourself.</p>
        </div>

        {/* AQI scale */}
        <h3 className="insights-sub">AQI Scale Explained</h3>
        <div className="aqi-scale-row">
          {AQI_SCALE.map((s) => (
            <div key={s.level} className="glass-card aqi-scale-card" style={{ borderColor: `${s.color}44` }}>
              <div className="aqs-level" style={{ color: s.color }}>{s.level}</div>
              <div className="aqs-label" style={{ color: s.color }}>{s.label}</div>
              <p className="aqs-desc">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Pollutants */}
        <h3 className="insights-sub">Major Pollutants</h3>
        <div className="pollutants-info-grid">
          {POLLUTANTS.map((p) => (
            <div key={p.symbol} className="glass-card pollutant-info-card">
              <div className="pi-header">
                <span className="pi-icon">{p.icon}</span>
                <div>
                  <div className="pi-symbol">{p.symbol}</div>
                  <div className="pi-name">{p.name}</div>
                </div>
                <div className="pi-who">
                  <div className="stat-label">WHO Guide</div>
                  <div style={{ color: '#90CAF9', fontWeight: 700, fontSize: '0.85rem' }}>{p.who}</div>
                </div>
              </div>
              <p className="pi-desc">{p.desc}</p>
              <div className="pi-sources">
                <span className="pi-sources-label">Sources:</span>
                {p.sources.map((s) => (
                  <span key={s} className="pi-source-tag">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Reduction tips */}
        <h3 className="insights-sub">How to Reduce Your Exposure</h3>
        <div className="reduction-grid">
          {REDUCTION_TIPS.map((t) => (
            <div key={t.tip} className="glass-card reduction-card">
              <span className="reduction-icon">{t.icon}</span>
              <p>{t.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
