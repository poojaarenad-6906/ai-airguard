// Air Quality Service — uses OpenWeatherMap Air Pollution API when a valid key
// is present, and falls back to clearly-labelled sample data otherwise.

const RAW_KEY = import.meta.env.VITE_OWM_API_KEY || '';
// Treat the key as missing if it's blank, a placeholder, or too short
const API_KEY = RAW_KEY.trim().length > 10 && !RAW_KEY.includes('your_') ? RAW_KEY.trim() : '';

const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const AQI_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

// ------------------------------------------------------------------
// Sample data — used when no API key is configured
// ------------------------------------------------------------------
const SAMPLE_CITIES = {
  default: {
    city: 'Mumbai',
    country: 'IN',
    aqi: 3,
    aqiLabel: 'Moderate',
    pm25: 45.2,
    pm10: 78.4,
    no2: 32.1,
    o3: 18.5,
    co: 620,
    so2: 12.3,
    nh3: 8.7,
    isDemo: true,
  },
  mumbai: {
    city: 'Mumbai',
    country: 'IN',
    aqi: 3,
    aqiLabel: 'Moderate',
    pm25: 45.2,
    pm10: 78.4,
    no2: 32.1,
    o3: 18.5,
    co: 620,
    so2: 12.3,
    nh3: 8.7,
    isDemo: true,
  },
  london: {
    city: 'London',
    country: 'GB',
    aqi: 2,
    aqiLabel: 'Fair',
    pm25: 12.3,
    pm10: 22.1,
    no2: 28.4,
    o3: 42.7,
    co: 310,
    so2: 5.2,
    nh3: 3.1,
    isDemo: true,
  },
  beijing: {
    city: 'Beijing',
    country: 'CN',
    aqi: 5,
    aqiLabel: 'Very Poor',
    pm25: 142.6,
    pm10: 215.3,
    no2: 87.2,
    o3: 8.1,
    co: 1850,
    so2: 41.6,
    nh3: 22.4,
    isDemo: true,
  },
  newyork: {
    city: 'New York',
    country: 'US',
    aqi: 2,
    aqiLabel: 'Fair',
    pm25: 9.8,
    pm10: 18.2,
    no2: 35.6,
    o3: 55.3,
    co: 280,
    so2: 4.1,
    nh3: 2.8,
    isDemo: true,
  },
  delhi: {
    city: 'Delhi',
    country: 'IN',
    aqi: 5,
    aqiLabel: 'Very Poor',
    pm25: 168.4,
    pm10: 243.7,
    no2: 95.3,
    o3: 5.2,
    co: 2100,
    so2: 52.8,
    nh3: 31.6,
    isDemo: true,
  },
  sydney: {
    city: 'Sydney',
    country: 'AU',
    aqi: 1,
    aqiLabel: 'Good',
    pm25: 4.2,
    pm10: 9.8,
    no2: 12.4,
    o3: 38.9,
    co: 180,
    so2: 2.1,
    nh3: 1.4,
    isDemo: true,
  },
  paris: {
    city: 'Paris',
    country: 'FR',
    aqi: 2,
    aqiLabel: 'Fair',
    pm25: 14.1,
    pm10: 24.3,
    no2: 38.7,
    o3: 44.2,
    co: 340,
    so2: 6.1,
    nh3: 4.2,
    isDemo: true,
  },
  tokyo: {
    city: 'Tokyo',
    country: 'JP',
    aqi: 2,
    aqiLabel: 'Fair',
    pm25: 11.8,
    pm10: 20.4,
    no2: 30.2,
    o3: 52.1,
    co: 260,
    so2: 4.8,
    nh3: 3.5,
    isDemo: true,
  },
  chicago: {
    city: 'Chicago',
    country: 'US',
    aqi: 2,
    aqiLabel: 'Fair',
    pm25: 10.2,
    pm10: 19.5,
    no2: 33.1,
    o3: 50.8,
    co: 295,
    so2: 4.5,
    nh3: 3.0,
    isDemo: true,
  },
  kolkata: {
    city: 'Kolkata',
    country: 'IN',
    aqi: 4,
    aqiLabel: 'Poor',
    pm25: 98.3,
    pm10: 156.2,
    no2: 72.4,
    o3: 9.8,
    co: 1450,
    so2: 38.1,
    nh3: 24.6,
    isDemo: true,
  },
  bangalore: {
    city: 'Bangalore',
    country: 'IN',
    aqi: 3,
    aqiLabel: 'Moderate',
    pm25: 48.7,
    pm10: 82.3,
    no2: 41.2,
    o3: 22.1,
    co: 710,
    so2: 15.4,
    nh3: 10.2,
    isDemo: true,
  },
  hyderabad: {
    city: 'Hyderabad',
    country: 'IN',
    aqi: 3,
    aqiLabel: 'Moderate',
    pm25: 52.1,
    pm10: 88.6,
    no2: 44.8,
    o3: 20.3,
    co: 780,
    so2: 17.2,
    nh3: 11.4,
    isDemo: true,
  },
  chennai: {
    city: 'Chennai',
    country: 'IN',
    aqi: 3,
    aqiLabel: 'Moderate',
    pm25: 41.6,
    pm10: 72.1,
    no2: 36.5,
    o3: 24.7,
    co: 580,
    so2: 13.8,
    nh3: 9.1,
    isDemo: true,
  },
};

const OWM_AQI_LABELS = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

function normalizeCity(name) {
  return name.toLowerCase().replace(/[\s\-_,.]+/g, '');
}

function getSampleData(cityName) {
  const key = normalizeCity(cityName);

  // Exact or partial match
  for (const [k, v] of Object.entries(SAMPLE_CITIES)) {
    if (k === 'default') continue;
    if (key === k || key.includes(k) || k.includes(key)) {
      return { ...v, city: cityName, updatedAt: new Date().toISOString() };
    }
  }

  // Generate plausible varied data for unknown cities
  const base = SAMPLE_CITIES.default;
  const vary = (val, pct = 0.4) =>
    Math.max(1, parseFloat((val * (1 + (Math.random() - 0.5) * pct)).toFixed(1)));
  const aqi = Math.min(5, Math.max(1, Math.round(1 + Math.random() * 3)));
  return {
    city: cityName,
    country: '',
    aqi,
    aqiLabel: OWM_AQI_LABELS[aqi],
    pm25: vary(base.pm25),
    pm10: vary(base.pm10),
    no2: vary(base.no2),
    o3: vary(base.o3),
    co: vary(base.co, 0.5),
    so2: vary(base.so2),
    nh3: vary(base.nh3),
    updatedAt: new Date().toISOString(),
    isDemo: true,
  };
}

export async function fetchAirQuality(cityName) {
  const trimmed = (cityName || '').trim();
  if (!trimmed) throw new Error('Please enter a city name.');

  // ── Demo mode (no valid API key) ──────────────────────────────────
  if (!API_KEY) {
    await new Promise((r) => setTimeout(r, 700)); // realistic feel
    return getSampleData(trimmed);
  }

  // ── Live mode (API key present) ───────────────────────────────────
  try {
    // 1. Geocode city → lat/lon
    const geoRes = await fetch(
      `${GEO_URL}?q=${encodeURIComponent(trimmed)}&limit=1&appid=${API_KEY}`
    );
    if (!geoRes.ok) {
      // API key invalid / quota exceeded — fall back to demo silently
      console.warn('OWM geocoding failed, using demo data:', geoRes.status);
      return { ...getSampleData(trimmed), isDemo: true };
    }
    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      // City not found in live API — still show demo data for that city
      return getSampleData(trimmed);
    }

    const { lat, lon, name, country } = geoData[0];

    // 2. Fetch air pollution data
    const aqiRes = await fetch(
      `${AQI_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    if (!aqiRes.ok) {
      console.warn('OWM AQI failed, using demo data:', aqiRes.status);
      return { ...getSampleData(trimmed), isDemo: true };
    }
    const aqiData = await aqiRes.json();

    const { aqi } = aqiData.list[0].main;
    const comp     = aqiData.list[0].components;

    return {
      city: name || trimmed,
      country: country || '',
      aqi,
      aqiLabel: OWM_AQI_LABELS[aqi] || 'Unknown',
      pm25: comp.pm2_5 ?? 0,
      pm10: comp.pm10  ?? 0,
      no2:  comp.no2   ?? 0,
      o3:   comp.o3    ?? 0,
      co:   comp.co    ?? 0,
      so2:  comp.so2   ?? 0,
      nh3:  comp.nh3   ?? 0,
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };
  } catch (networkErr) {
    // Network failure — fall back to demo data, never show a crash
    console.warn('Network error, using demo data:', networkErr.message);
    return { ...getSampleData(trimmed), isDemo: true };
  }
}

// Generate synthetic 7-day trend data for charts
export function generateTrendData(currentAqi) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base  = Math.max(1, currentAqi) * 40;
  return days.map((day) => ({
    day,
    aqi:  Math.max(10, Math.round(base + (Math.random() - 0.5) * base * 0.55)),
    pm25: Math.max(1,  Math.round((base / 2) * (0.7 + Math.random() * 0.6))),
    pm10: Math.max(1,  Math.round(base       * (0.8 + Math.random() * 0.4))),
  }));
}
