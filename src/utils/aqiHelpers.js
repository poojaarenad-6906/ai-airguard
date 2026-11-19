/**
 * AQI Helpers — Indian AQI classification + formatting utilities
 */

// Indian AQI scale (CPCB standard)
export const AQI_LEVELS = {
  GOOD:        { min: 0,   max: 50,  label: 'Good',         color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)',   description: 'Air quality is satisfactory. Minimal health risk.' },
  SATISFACTORY:{ min: 51,  max: 100, label: 'Satisfactory', color: '#84CC16', bg: 'rgba(132,204,22,0.12)',  border: 'rgba(132,204,22,0.35)',  description: 'Air quality acceptable. Minor discomfort for sensitive groups.' },
  MODERATE:    { min: 101, max: 200, label: 'Moderate',      color: '#EAB308', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.35)',   description: 'Sensitive groups may experience minor health effects.' },
  POOR:        { min: 201, max: 300, label: 'Poor',          color: '#F97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.35)',  description: 'Health effects possible for everyone. Sensitive groups serious effects.' },
  VERY_POOR:   { min: 301, max: 400, label: 'Very Poor',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   description: 'Health alert. Everyone may experience serious health effects.' },
  SEVERE:      { min: 401, max: 500, label: 'Severe',        color: '#9333EA', bg: 'rgba(147,51,234,0.12)',  border: 'rgba(147,51,234,0.35)',  description: 'Hazardous. Serious risk. Avoid all outdoor activity.' },
};

export function getAqiLevel(aqi) {
  const v = Number(aqi) || 0;
  if (v <= 50)  return AQI_LEVELS.GOOD;
  if (v <= 100) return AQI_LEVELS.SATISFACTORY;
  if (v <= 200) return AQI_LEVELS.MODERATE;
  if (v <= 300) return AQI_LEVELS.POOR;
  if (v <= 400) return AQI_LEVELS.VERY_POOR;
  return AQI_LEVELS.SEVERE;
}

export function getAqiPercentage(aqi) {
  return Math.min(100, Math.max(0, (Number(aqi) / 500) * 100));
}

export function formatPollutant(value, unit = 'μg/m³') {
  if (value === null || value === undefined) return 'N/A';
  const v = Number(value);
  if (isNaN(v)) return 'N/A';
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${unit}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return 'Unknown';
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return isoString; }
}

// Convert OWM AQI (1–5) to Indian AQI (0–500) approximate
export function owmToIndianAqi(owmAqi, pm25) {
  const pm = Number(pm25) || 0;
  if (pm <= 12)  return Math.round(pm * 4.17);        // 0–50
  if (pm <= 35)  return Math.round(50 + (pm-12)*2.17); // 51–100
  if (pm <= 55)  return Math.round(100 + (pm-35)*5);   // 101–200
  if (pm <= 150) return Math.round(200 + (pm-55)*1.05);// 201–300
  if (pm <= 250) return Math.round(300 + (pm-150));    // 301–400
  return Math.min(500, Math.round(400 + (pm-250)*0.4));
}

export function getHealthCategoryRisk(healthProfile, aqi) {
  const v = Number(aqi);
  const risks = {
    children: v > 100 ? 'High Risk' : v > 50 ? 'Moderate Risk' : 'Low Risk',
    elderly:  v > 100 ? 'High Risk' : v > 50 ? 'Moderate Risk' : 'Low Risk',
    adults:   v > 200 ? 'High Risk' : v > 100 ? 'Moderate Risk' : 'Low Risk',
    asthma:   v > 50  ? 'High Risk' : v > 30  ? 'Moderate Risk' : 'Low Risk',
    cardiac:  v > 100 ? 'High Risk' : v > 50  ? 'Moderate Risk' : 'Low Risk',
  };
  return risks[healthProfile] || risks.adults;
}
