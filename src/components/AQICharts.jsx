import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { generateTrendData, generate7DayTrend } from '../services/airQualityService';
import { getAqiLevel } from '../utils/aqiHelpers';

const CHART_COLORS = { aqi: '#38BDF8', pm25: '#EF4444', pm10: '#F97316', no2: '#EAB308', so2: '#8DD8FF', co: '#22C55E' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d2847', border: '1px solid #35516D', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#8DD8FF', marginBottom: 6, fontSize: '0.82rem', fontWeight: 700 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: '0.8rem' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AQICharts({ data }) {
  const hourlyTrend = useMemo(() => generateTrendData(data.aqi), [data.aqi]);
  const weeklyTrend = useMemo(() => generate7DayTrend(data.aqi), [data.aqi]);

  const radarData = [
    { subject: 'PM2.5', value: Math.min(100, (data.pm25 / 120) * 100) },
    { subject: 'PM10',  value: Math.min(100, (data.pm10 / 200) * 100) },
    { subject: 'NO₂',   value: Math.min(100, (data.no2 / 100) * 100) },
    { subject: 'SO₂',   value: Math.min(100, (data.so2 / 80) * 100) },
    { subject: 'CO',    value: Math.min(100, (data.co / 2000) * 100) },
    { subject: 'O₃',    value: Math.min(100, (data.o3 / 100) * 100) },
  ];

  const level = getAqiLevel(data.aqi);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">📈 AQI Trends & Analytics</h2>
        <p className="section-subtitle">24-hour and 7-day pollution trends for {data.location || data.city}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* 24-hour AQI trend */}
        <div className="glass-card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>📊 24-Hour AQI Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hourlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(53,81,109,0.4)" />
              <XAxis dataKey="hour" tick={{ fill: '#8BA8C4', fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: '#8BA8C4', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={100} stroke="#EAB308" strokeDasharray="4 4" label={{ value: 'Moderate', fill: '#EAB308', fontSize: 10 }} />
              <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Poor', fill: '#EF4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="aqi" stroke={CHART_COLORS.aqi} strokeWidth={2.5} dot={false} name="AQI" />
              <Line type="monotone" dataKey="pm25" stroke={CHART_COLORS.pm25} strokeWidth={1.5} dot={false} name="PM2.5" />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ color: '#8BA8C4', fontSize: '0.75rem', marginTop: 8 }}>⚠️ Trend based on Bengaluru traffic patterns · Demo simulation</p>
        </div>

        {/* 7-day bar chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>📅 7-Day AQI Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(53,81,109,0.4)" />
              <XAxis dataKey="day" tick={{ fill: '#8BA8C4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8BA8C4', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="aqi" fill={CHART_COLORS.aqi} radius={[4,4,0,0]} name="AQI" />
              <Bar dataKey="pm25" fill={CHART_COLORS.pm25} radius={[4,4,0,0]} name="PM2.5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Radar chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>🕸️ Pollutant Profile</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(53,81,109,0.5)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#DBEAFE', fontSize: 11 }} />
              <Radar dataKey="value" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
          <p style={{ color: '#8BA8C4', fontSize: '0.75rem', textAlign: 'center' }}>Values normalized to % of safe threshold</p>
        </div>

        {/* Pollutant stats table */}
        <div className="glass-card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>📋 Pollutant Summary</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Pollutant</th>
                <th>Current</th>
                <th>CPCB Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'PM2.5', value: data.pm25, limit: 60,   unit: 'μg/m³' },
                { name: 'PM10',  value: data.pm10, limit: 100,  unit: 'μg/m³' },
                { name: 'NO₂',   value: data.no2,  limit: 80,   unit: 'μg/m³' },
                { name: 'SO₂',   value: data.so2,  limit: 80,   unit: 'μg/m³' },
                { name: 'CO',    value: data.co,   limit: 2000, unit: 'μg/m³' },
                { name: 'O₃',    value: data.o3,   limit: 100,  unit: 'μg/m³' },
              ].map(p => {
                const exceeded = p.value > p.limit;
                return (
                  <tr key={p.name}>
                    <td style={{ color: '#8DD8FF', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: exceeded ? '#EF4444' : '#22C55E', fontWeight: 700 }}>{p.value} {p.unit}</td>
                    <td style={{ color: '#8BA8C4' }}>{p.limit} {p.unit}</td>
                    <td>
                      <span className="badge" style={{
                        background: exceeded ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                        color: exceeded ? '#EF4444' : '#22C55E',
                        border: `1px solid ${exceeded ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        fontSize: '0.68rem',
                      }}>
                        {exceeded ? '⚠️ Exceeded' : '✅ OK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ color: '#8BA8C4', fontSize: '0.72rem', marginTop: 8 }}>Source: CPCB (Central Pollution Control Board) standards</p>
        </div>
      </div>
    </div>
  );
}
