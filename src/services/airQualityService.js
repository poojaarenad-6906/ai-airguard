/**
 * AI AirGuard — Air Quality Service
 * Routes data requests through the Python backend.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// ── Bengaluru area AQI profiles (based on real pollution patterns) ─────────
const BENGALURU_PROFILES = {
  'electronic city':     { baseAqi: 145, pm25: 52, pm10: 88,  no2: 42, so2: 18, co: 850,  source: 'Industrial + Traffic' },
  'peenya':              { baseAqi: 198, pm25: 72, pm10: 128, no2: 65, so2: 35, co: 1200, source: 'Industrial Emissions' },
  'silk board':          { baseAqi: 162, pm25: 58, pm10: 96,  no2: 55, so2: 22, co: 980,  source: 'Traffic Congestion' },
  'marathahalli':        { baseAqi: 155, pm25: 54, pm10: 92,  no2: 48, so2: 20, co: 920,  source: 'Traffic + Construction' },
  'whitefield':          { baseAqi: 148, pm25: 50, pm10: 85,  no2: 45, so2: 19, co: 890,  source: 'IT Hub Traffic' },
  'hebbal':              { baseAqi: 160, pm25: 56, pm10: 94,  no2: 52, so2: 21, co: 950,  source: 'Highway + Industrial' },
  'kr puram':            { baseAqi: 172, pm25: 62, pm10: 108, no2: 58, so2: 28, co: 1050, source: 'Industrial + Traffic' },
  'bellandur':           { baseAqi: 185, pm25: 68, pm10: 118, no2: 62, so2: 32, co: 1100, source: 'Lake Pollution + Traffic' },
  'yelahanka':           { baseAqi: 95,  pm25: 32, pm10: 58,  no2: 28, so2: 10, co: 520,  source: 'Residential' },
  'manyata tech park':   { baseAqi: 125, pm25: 44, pm10: 76,  no2: 38, so2: 15, co: 720,  source: 'Office Traffic' },
  'koramangala':         { baseAqi: 118, pm25: 40, pm10: 72,  no2: 36, so2: 14, co: 680,  source: 'Commercial Traffic' },
  'indiranagar':         { baseAqi: 112, pm25: 38, pm10: 68,  no2: 34, so2: 13, co: 650,  source: 'Commercial Area' },
  'hsr layout':          { baseAqi: 108, pm25: 36, pm10: 64,  no2: 32, so2: 12, co: 620,  source: 'Residential IT' },
  'jayanagar':           { baseAqi: 102, pm25: 34, pm10: 62,  no2: 30, so2: 11, co: 590,  source: 'Mixed Residential' },
  'jp nagar':            { baseAqi: 105, pm25: 35, pm10: 63,  no2: 31, so2: 12, co: 600,  source: 'Residential' },
  'btm layout':          { baseAqi: 115, pm25: 39, pm10: 70,  no2: 35, so2: 13, co: 660,  source: 'Commercial' },
  'mg road':             { baseAqi: 135, pm25: 48, pm10: 82,  no2: 45, so2: 18, co: 820,  source: 'Central Business District' },
  'malleswaram':         { baseAqi: 110, pm25: 37, pm10: 66,  no2: 33, so2: 12, co: 630,  source: 'Old City Traffic' },
  'yeshwanthpur':        { baseAqi: 155, pm25: 54, pm10: 92,  no2: 50, so2: 24, co: 930,  source: 'Industrial + Railway' },
  'tumkur road':         { baseAqi: 178, pm25: 64, pm10: 112, no2: 60, so2: 30, co: 1080, source: 'Highway Traffic + Trucks' },
  'kengeri':             { baseAqi: 88,  pm25: 29, pm10: 52,  no2: 25, so2: 9,  co: 480,  source: 'Suburban' },
  'bannerghatta road':   { baseAqi: 125, pm25: 43, pm10: 75,  no2: 38, so2: 15, co: 710,  source: 'Industrial Outskirts' },
  'outer ring road':     { baseAqi: 168, pm25: 60, pm10: 102, no2: 56, so2: 26, co: 1020, source: 'Highway Traffic' },
  'sarjapur road':       { baseAqi: 142, pm25: 50, pm10: 86,  no2: 44, so2: 18, co: 840,  source: 'IT Corridor Traffic' },
  'default':             { baseAqi: 128, pm25: 44, pm10: 78,  no2: 38, so2: 16, co: 740,  source: 'Mixed Urban' },
};

function getProfileForLocation(locationName) {
  const q = locationName.toLowerCase();
  for (const [key, profile] of Object.entries(BENGALURU_PROFILES)) {
    if (key !== 'default' && (q.includes(key) || key.includes(q.split(' ')[0]))) {
      return profile;
    }
  }
  return BENGALURU_PROFILES.default;
}

function generateBengaluruData(locationName, lat, lng) {
  const profile = getProfileForLocation(locationName);
  const timeVariation = getTimeVariation();
  const vary = (val, pct = 0.15) => Math.max(1, parseFloat((val * timeVariation * (1 + (Math.random() - 0.5) * pct)).toFixed(1)));

  return {
    city: locationName,
    location: locationName,
    lat: lat || 12.9716,
    lng: lng || 77.5946,
    aqi: Math.round(vary(profile.baseAqi, 0.2)),
    pm25: vary(profile.pm25),
    pm10: vary(profile.pm10),
    no2: vary(profile.no2),
    so2: vary(profile.so2),
    co: vary(profile.co),
    o3: parseFloat((18 + Math.random() * 25).toFixed(1)),
    nh3: parseFloat((8 + Math.random() * 15).toFixed(1)),
    temp: parseFloat((22 + Math.random() * 8).toFixed(1)),
    humidity: Math.round(55 + Math.random() * 30),
    windSpeed: parseFloat((2 + Math.random() * 8).toFixed(1)),
    windDir: Math.round(Math.random() * 360),
    dominantPollutant: profile.pm25 > 50 ? 'PM2.5' : 'NO₂',
    primarySource: profile.source,
    updatedAt: new Date().toISOString(),
    isDemo: true,
    dataSource: 'AI AirGuard Demo — Based on Bengaluru pollution patterns',
  };
}

function getTimeVariation() {
  const hour = new Date().getHours();
  // Peak hours: 8-10am, 6-9pm; Low: 2-4am
  if (hour >= 7 && hour <= 10) return 1.25;
  if (hour >= 17 && hour <= 20) return 1.35;
  if (hour >= 2 && hour <= 5) return 0.75;
  return 1.0;
}

export async function fetchAirQuality(locationName, lat, lng) {
  const trimmed = (locationName || '').trim();
  if (!trimmed) throw new Error('Please enter a location name.');

  try {
    const params = new URLSearchParams({ city: trimmed });
    if (lat) params.append('lat', lat);
    if (lng) params.append('lng', lng);
    const res = await fetch(`${BACKEND_URL}/api/airquality?${params}`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      return { ...data, updatedAt: data.updatedAt || new Date().toISOString() };
    }
  } catch { /* backend unavailable — use local demo */ }

  await new Promise(r => setTimeout(r, 500));
  return generateBengaluruData(trimmed, lat, lng);
}

export async function fetchHotspotData() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/hotspots`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return await res.json();
  } catch { /* use local fallback */ }

  // Local fallback
  const hotspots = [
    { name: 'Peenya Industrial Area', lat: 13.0276, lng: 77.5202 },
    { name: 'Silk Board Junction', lat: 12.9173, lng: 77.6241 },
    { name: 'KR Puram', lat: 13.0057, lng: 77.7039 },
    { name: 'Outer Ring Road', lat: 12.9279, lng: 77.6701 },
    { name: 'Bellandur', lat: 12.9254, lng: 77.6774 },
    { name: 'Tumkur Road', lat: 13.0169, lng: 77.5202 },
    { name: 'Hebbal Flyover', lat: 13.0453, lng: 77.5908 },
    { name: 'Electronic City', lat: 12.8456, lng: 77.6603 },
    { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
    { name: 'Marathahalli Bridge', lat: 12.9591, lng: 77.6974 },
  ];
  return hotspots.map(h => ({ ...h, ...generateBengaluruData(h.name, h.lat, h.lng) }));
}

export function generateTrendData(baseAqi) {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`);
  const base = Number(baseAqi) || 128;
  return hours.map((hour, i) => {
    const h = parseInt(hour);
    const timeMult = (h >= 7 && h <= 10) ? 1.3 : (h >= 17 && h <= 21) ? 1.4 : (h >= 2 && h <= 5) ? 0.7 : 1.0;
    return {
      hour,
      aqi: Math.round(base * timeMult * (0.9 + Math.random() * 0.2)),
      pm25: Math.round((base * 0.4) * timeMult * (0.9 + Math.random() * 0.2)),
      pm10: Math.round((base * 0.7) * timeMult * (0.9 + Math.random() * 0.2)),
    };
  });
}

export function generate7DayTrend(baseAqi) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = Number(baseAqi) || 128;
  return days.map(day => ({
    day,
    aqi:  Math.round(base * (0.75 + Math.random() * 0.5)),
    pm25: Math.round((base * 0.4) * (0.75 + Math.random() * 0.5)),
    pm10: Math.round((base * 0.7) * (0.75 + Math.random() * 0.5)),
  }));
}
