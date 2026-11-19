import { useState } from 'react';
import { AGENTS, AGENT_META, getAgentLog, getAgentCallCounts } from '../services/agentService';

export default function AgentPanel({ agentResults, airData, onRunAgents }) {
  const [activeAgent, setActiveAgent] = useState(null);
  const log = getAgentLog();
  const counts = getAgentCallCounts();

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 40px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="section-title">⚙️ Five-Agent AI Workflow</h2>
          <p className="section-subtitle">Multi-agent collaboration for Bengaluru environmental intelligence · IBM Granite orchestrated</p>
        </div>
        <button className="btn btn-primary" onClick={onRunAgents} disabled={!airData}>
          🔄 Re-run All Agents
        </button>
      </div>

      {/* Agent cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {Object.values(AGENTS).map(agentId => {
          const meta = AGENT_META[agentId];
          const hasResult = !!agentResults?.[agentId === AGENTS.HOTSPOT ? 'hotspot' : agentId === AGENTS.MONITORING ? 'monitoring' : agentId === AGENTS.SOURCE ? 'source' : agentId === AGENTS.HEALTH ? 'health' : 'environmental'];
          const isActive = activeAgent === agentId;
          return (
            <div key={agentId}
              className="glass-card"
              onClick={() => setActiveAgent(isActive ? null : agentId)}
              style={{ cursor: 'pointer', borderColor: isActive ? meta.color + '88' : 'var(--border)', textAlign: 'center', padding: '16px 12px', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{meta.icon}</div>
              <div style={{ color: meta.color, fontWeight: 700, fontSize: '0.78rem', marginBottom: 4 }}>{meta.name}</div>
              <div style={{ color: '#8BA8C4', fontSize: '0.68rem', lineHeight: 1.4, marginBottom: 10 }}>{meta.description}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                <span className="badge" style={{
                  background: hasResult ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                  color: hasResult ? '#22C55E' : '#EAB308',
                  border: `1px solid ${hasResult ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
                  fontSize: '0.65rem',
                }}>
                  {hasResult ? '✅ Active' : '⏳ Standby'}
                </span>
              </div>
              {counts[agentId] > 0 && (
                <div style={{ color: '#8BA8C4', fontSize: '0.65rem', marginTop: 6 }}>{counts[agentId]} call(s)</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agent detail */}
      {activeAgent && agentResults && (
        <div className="glass-card fade-in" style={{ marginBottom: 24, borderColor: AGENT_META[activeAgent]?.color + '44' }}>
          <h3 style={{ color: AGENT_META[activeAgent]?.color, marginBottom: 16 }}>
            {AGENT_META[activeAgent]?.icon} {AGENT_META[activeAgent]?.name} — Output
          </h3>
          <pre style={{ color: '#DBEAFE', fontSize: '0.8rem', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8 }}>
            {JSON.stringify(
              agentResults[activeAgent === AGENTS.HOTSPOT ? 'hotspot' : activeAgent === AGENTS.MONITORING ? 'monitoring' : activeAgent === AGENTS.SOURCE ? 'source' : activeAgent === AGENTS.HEALTH ? 'health' : 'environmental'],
              null, 2
            )}
          </pre>
        </div>
      )}

      {/* Agent Communication Flow */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>🔗 Agent Communication Flow</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', padding: '12px 0' }}>
          {[
            { label: 'User Query', icon: '👤', color: '#8BA8C4' },
            { label: '→', color: '#35516D' },
            { label: 'Environmental Agent\n(Supervisor)', icon: '🌍', color: '#8DD8FF' },
            { label: '⇒', color: '#35516D' },
            { label: 'Monitoring\nAgent', icon: '📡', color: '#38BDF8' },
            { label: '⇒', color: '#35516D' },
            { label: 'Hotspot\nAgent', icon: '🔥', color: '#F97316' },
            { label: '⇒', color: '#35516D' },
            { label: 'Source\nAgent', icon: '🏭', color: '#EAB308' },
            { label: '⇒', color: '#35516D' },
            { label: 'Health\nAgent', icon: '🩺', color: '#22C55E' },
            { label: '⇒', color: '#35516D' },
            { label: 'Unified\nResponse', icon: '📊', color: '#8DD8FF' },
          ].map((item, i) => (
            item.label === '→' || item.label === '⇒' ? (
              <span key={i} style={{ color: '#35516D', fontSize: '1.4rem', flexShrink: 0 }}>{item.label}</span>
            ) : (
              <div key={i} style={{ textAlign: 'center', padding: '10px 14px', background: `${item.color}18`, border: `1px solid ${item.color}44`, borderRadius: 10, minWidth: 90, flexShrink: 0 }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{item.icon}</div>
                <div style={{ color: item.color, fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'pre-line' }}>{item.label}</div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Execution log */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>📋 Agent Execution Log</h3>
        {log.length === 0 ? (
          <p style={{ color: '#8BA8C4', fontSize: '0.85rem' }}>No agent calls logged yet. Search a location to trigger the agent workflow.</p>
        ) : (
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Agent</th><th>Action</th><th>Input</th><th>Duration</th><th>Time</th></tr>
              </thead>
              <tbody>
                {log.slice(0, 20).map(entry => (
                  <tr key={entry.id}>
                    <td>
                      <span style={{ color: AGENT_META[entry.agent]?.color || '#8BA8C4', fontWeight: 600, fontSize: '0.78rem' }}>
                        {AGENT_META[entry.agent]?.icon} {entry.agentName?.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </td>
                    <td style={{ color: '#DBEAFE', fontSize: '0.78rem' }}>{entry.action}</td>
                    <td style={{ color: '#8BA8C4', fontSize: '0.75rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.input}</td>
                    <td style={{ color: '#22C55E', fontSize: '0.78rem' }}>{entry.durationMs}ms</td>
                    <td style={{ color: '#8BA8C4', fontSize: '0.72rem' }}>{new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
