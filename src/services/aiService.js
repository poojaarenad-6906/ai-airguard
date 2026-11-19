/**
 * AI AirGuard — AI Service
 * Routes all LLM calls through the Python backend proxy.
 * API keys are NEVER exposed to the browser.
 */

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const PROVIDERS = { WATSONX: 'watsonx', GROQ: 'groq', DEMO: 'demo' };

// Determine active provider by checking backend health
let _backendProvider = null;
let _backendModel = 'ibm/granite-4-h-small';

async function checkBackendProvider() {
  try {
    const r = await fetch(`${BACKEND}/api/health`);
    if (r.ok) {
      const d = await r.json();
      _backendModel = d.model || 'ibm/granite-4-h-small';
      if (d.granite) { _backendProvider = PROVIDERS.WATSONX; return; }
      if (d.groq)    { _backendProvider = PROVIDERS.GROQ;    return; }
    }
  } catch { /* backend unavailable */ }
  _backendProvider = PROVIDERS.DEMO;
}
checkBackendProvider();

export function getActiveProvider() { return _backendProvider || PROVIDERS.DEMO; }
export const activeProvider = new Proxy({}, {
  get: () => _backendProvider || PROVIDERS.DEMO,
});

export const providerMeta = {
  [PROVIDERS.WATSONX]: { label: 'IBM Granite (watsonx.ai)', icon: '🔵', model: _backendModel, color: '#38BDF8' },
  [PROVIDERS.GROQ]:    { label: 'Groq (Llama3 — Fallback)', icon: '⚡', model: 'llama3-8b-8192', color: '#22C55E' },
  [PROVIDERS.DEMO]:    { label: 'Demo (rule-based)',         icon: '🔧', model: 'built-in',       color: '#EAB308' },
};

function buildSystemPrompt(ctx) {
  const loc = ctx?.location || ctx?.city || 'Bengaluru';
  const aqi = ctx?.aqi;
  const aqiInfo = aqi ? ` Current AQI at ${loc} is ${aqi} (${ctx.aqiLabel || ''}).` : '';
  return `You are AI AirGuard, Bengaluru's AI-powered air quality and environmental intelligence assistant. You help citizens understand pollution, health risks, safe routes and environmental data.${aqiInfo}
You are powered by IBM Granite on watsonx.ai. Keep answers concise (2-4 sentences or a brief list). Always note health recommendations are general guidance, not medical advice. Focus on Bengaluru-specific insights when relevant.`;
}

// ── All LLM calls go through the backend proxy (never expose keys) ──────────

export async function generate(messages, ctx) {
  try {
    const res = await fetch(`${BACKEND}/api/granite/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, locationData: ctx }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const d = await res.json();
      if (d.text) return { text: d.text, provider: d.provider, model: d.model };
    }
    if (!res.ok && res.status !== 503) throw new Error(`Backend error ${res.status}`);
  } catch (err) {
    if (err.name === 'AbortError') console.warn('AI request timed out');
    else console.warn('Backend AI call failed:', err.message);
  }
  await new Promise(r => setTimeout(r, 400));
  return null; // caller uses rule-based demo
}

// ── Specialized AI calls for agents ────────────────────────────────────────

export async function analyzeAirQuality(data) {
  try {
    const res = await fetch(`${BACKEND}/api/agents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationData: data, task: 'full_analysis' }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const d = await res.json();
      if (d.analysis) return d.analysis;
    }
  } catch (e) { console.warn('analyzeAirQuality backend error:', e.message); }
  return generateDemoAnalysis(data);
}

export async function analyzeRoute(origin, destination, healthProfile, requestId) {
  const reqId = requestId || `${origin}|${destination}|${Date.now()}`;
  try {
    const res = await fetch(`${BACKEND}/api/journey/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, healthProfile, requestId: reqId }),
      signal: AbortSignal.timeout(35000),
    });
    if (res.ok) {
      const d = await res.json();
      // Return the FULL backend response so the UI gets hotspots, alternatives,
      // travelTime and routeInfo — all dynamically calculated for this route.
      return {
        origin,
        destination,
        healthProfile,
        requestId:     d.requestId || reqId,
        routeAnalysis: d.routeAnalysis || generateDemoRouteAnalysis(origin, destination, healthProfile),
        hotspots:      d.hotspots      || [],
        alternatives:  d.alternatives  || [],
        travelTime:    d.travelTime    || null,
        routeInfo:     d.routeInfo     || null,
        originData:    d.originData    || null,
        destData:      d.destData      || null,
        provider:      d.provider,
      };
    }
  } catch (e) { console.warn('analyzeRoute backend error:', e.message); }
  // Minimal fallback — clearly labelled, no fake route data
  return {
    origin, destination, healthProfile, requestId: reqId,
    routeAnalysis: generateDemoRouteAnalysis(origin, destination, healthProfile),
    hotspots: [], alternatives: [], travelTime: null, routeInfo: null,
    originData: null, destData: null, provider: 'demo',
  };
}

export async function simulatePollution(scenario) {
  try {
    const res = await fetch(`${BACKEND}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: scenario.type, params: scenario.params }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const d = await res.json();
      return d.result || generateDemoSimulation(scenario);
    }
  } catch (e) { console.warn('simulatePollution backend error:', e.message); }
  return generateDemoSimulation(scenario);
}

function generateDemoAnalysis(data) {
  const aqi = Number(data.aqi) || 128;
  const loc = data.location || data.city || 'this area';
  if (aqi > 200) return `⚠️ **Poor Air Quality Alert** at ${loc}. AQI ${aqi} indicates significant health risks. PM2.5 (${data.pm25} μg/m³) exceeds safe limits — likely from ${data.primarySource || 'traffic and industrial emissions'}. Sensitive groups should avoid outdoor activity. Use N95 masks and keep windows closed.`;
  if (aqi > 100) return `🟡 **Moderate Pollution** at ${loc}. AQI ${aqi} — primarily driven by ${data.primarySource || 'traffic emissions'}. PM2.5 at ${data.pm25} μg/m³ is elevated. Children and elderly should limit outdoor exposure. Regular adults can go out with precautions during peak hours (7–10am, 6–9pm).`;
  return `🟢 **Acceptable Air Quality** at ${loc}. AQI ${aqi} — within manageable range. PM2.5 at ${data.pm25} μg/m³. Standard precautions apply. Avoid heavy exercise during peak traffic hours.`;
}

function generateDemoRouteAnalysis(origin, destination, profile) {
  const profileAdvice = {
    children: 'Keep children indoors if AQI > 100. Use filtered transport.',
    elderly:  'Seniors should travel during 11am–4pm when pollution is lower. Carry inhalers.',
    asthma:   'People with asthma: wear N95 mask, avoid Silk Board and ORR during peak hours.',
    cardiac:  'Cardiovascular patients: minimize exposure near industrial areas. Travel in AC vehicles.',
    adults:   'Standard precautions: avoid peak hours, use public transport where possible.',
  };
  return `🗺️ **AirSafe Journey: ${origin} → ${destination}**\n\n**Route Analysis:** This route likely passes through moderate to high-pollution zones in Bengaluru. Expected AQI along route: 110–165.\n\n**Hotspots to Watch:** Silk Board Junction and Outer Ring Road are high-congestion zones with elevated PM2.5.\n\n**Best Travel Time:** 11am–3pm or after 9pm to avoid peak pollution.\n\n**Health Advice (${profile}):** ${profileAdvice[profile] || profileAdvice.adults}\n\n**Alternative:** Consider using Namma Metro if available — significantly reduces pollution exposure.\n\n*Note: Based on Bengaluru traffic patterns. Data from AI AirGuard demo.*`;
}

function generateDemoSimulation(scenario) {
  const type = scenario.type || 'traffic';
  const impacts = {
    traffic:      'Traffic surge scenario: AQI likely to increase by 25–40% in affected corridors. NO2 and CO will spike during 7–10am and 5–9pm.',
    construction: 'Construction dust scenario: PM10 and PM2.5 increase significantly within 500m radius. Dust suppression and water spraying recommended.',
    wind:         'Wind change scenario: Pollutants from industrial areas shift direction. Peenya Industrial Area emissions may affect northern residential areas.',
    rainfall:     'Rainfall scenario: AQI expected to drop 30–50% within 2 hours. PM2.5 washout effect. Air quality significantly improved.',
    festival:     'Festival/Diwali scenario: Fireworks cause PM2.5 spike to 200–300+ μg/m³. Severe health risk for 4–6 hours post-event.',
  };
  return impacts[type] || `Simulation for ${type}: Moderate environmental impact expected. Monitor AQI every 30 minutes.`;
}
