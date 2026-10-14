import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { generateTrendData } from '../services/airQualityService';
import { getAqiLevel } from '../utils/aqiHelpers';
import '../styles/charts.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="ct-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AqiCharts({ data }) {
  if (!data) return null;
  const trendData = generateTrendData(data.aqi);
  const level = getAqiLevel(data.aqi);

  const pollutantData = [
    { name: 'PM2.5', value: data.pm25, fill: '#29B6F6' },
    { name: 'PM10',  value: data.pm10, fill: '#26C6DA' },
    { name: 'NO₂',   value: data.no2,  fill: '#AB47BC' },
    { name: 'O₃',    value: data.o3,   fill: '#66BB6A' },
    { name: 'SO₂',   value: data.so2,  fill: '#FFA726' },
    { name: 'NH₃',   value: data.nh3,  fill: '#EF5350' },
  ];

  return (
    <section className="section fade-in">
      <div className="container">
        <div className="section-title">
          <h2>📊 AQI Charts</h2>
          <p>
            Air quality trend and pollutant breakdown for {data.city}.{' '}
            <span className="demo-notice">⚠️ 7-day trend uses estimated data</span>
          </p>
        </div>

        <div className="charts-grid">
          {/* 7-day trend */}
          <div className="glass-card chart-card">
            <h3>7-Day AQI Trend</h3>
            <p className="chart-sub">Estimated trend based on current AQI level</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={level.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={level.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(141,216,255,0.08)" />
                <XAxis dataKey="day" tick={{ fill: '#8BA8C4', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8BA8C4', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="aqi" name="AQI" stroke={level.color} strokeWidth={2} fill="url(#aqiGrad)" dot={{ fill: level.color, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* PM2.5 / PM10 trend */}
          <div className="glass-card chart-card">
            <h3>PM2.5 &amp; PM10 Trend</h3>
            <p className="chart-sub">Particulate matter concentrations (μg/m³) — estimated</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#29B6F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#29B6F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pm10Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8DD8FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8DD8FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(141,216,255,0.08)" />
                <XAxis dataKey="day" tick={{ fill: '#8BA8C4', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8BA8C4', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#8BA8C4', fontSize: 12 }} />
                <Area type="monotone" dataKey="pm25" name="PM2.5" stroke="#29B6F6" strokeWidth={2} fill="url(#pm25Grad)" dot={{ fill: '#29B6F6', r: 3 }} />
                <Area type="monotone" dataKey="pm10" name="PM10"  stroke="#8DD8FF" strokeWidth={2} fill="url(#pm10Grad)" dot={{ fill: '#8DD8FF', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pollutant comparison */}
          <div className="glass-card chart-card chart-full">
            <h3>Current Pollutant Levels Comparison</h3>
            <p className="chart-sub">Live measurement values (μg/m³) from latest data retrieval</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pollutantData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(141,216,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: '#8BA8C4', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8BA8C4', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="μg/m³" radius={[6,6,0,0]}>
                  {pollutantData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
