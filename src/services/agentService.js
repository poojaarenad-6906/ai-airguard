/**
 * AI AirGuard — Five-Agent System
 * 
 * 1. Air Quality Monitoring Agent
 * 2. Pollution Hotspot Analysis Agent
 * 3. Pollution Source Intelligence Agent
 * 4. Citizen Health & AirSafe Journey Agent
 * 5. Environmental Intelligence Agent (Supervisor/Orchestrator)
 */

import { analyzeAirQuality, analyzeRoute, simulatePollution, generate } from './aiService.js';

// ── Agent Registry ──────────────────────────────────────────────────────────

export const AGENTS = {
  MONITORING:    'monitoring',
  HOTSPOT:       'hotspot',
  SOURCE:        'source',
  HEALTH:        'health',
  ENVIRONMENTAL: 'environmental',
};

export const AGENT_META = {
  [AGENTS.MONITORING]: {
    name: 'Air Quality Monitoring Agent',
    icon: '📡',
    description: 'Monitors AQI, PM2.5, PM10, NO2, SO2, CO and weather conditions',
    color: '#38BDF8',
  },
  [AGENTS.HOTSPOT]: {
    name: 'Pollution Hotspot Analysis Agent',
    icon: '🔥',
    description: 'Identifies and ranks polluted locations, analyzes historical trends',
    color: '#F97316',
  },
  [AGENTS.SOURCE]: {
    name: 'Pollution Source Intelligence Agent',
    icon: '🏭',
    description: 'Analyzes traffic, industrial emissions, construction, weather, road dust',
    color: '#EAB308',
  },
  [AGENTS.HEALTH]: {
    name: 'Citizen Health & AirSafe Journey Agent',
    icon: '🩺',
    description: 'Personalized health precautions and pollution-aware travel recommendations',
    color: '#22C55E',
  },
  [AGENTS.ENVIRONMENTAL]: {
    name: 'Environmental Intelligence Agent',
    icon: '🌍',
    description: 'Supervisor: orchestrates agents, construction monitoring, smart alerts',
    color: '#8DD8FF',
  },
};

// ── Agent execution log ─────────────────────────────────────────────────────
const agentLog = [];
let agentCallCount = { [AGENTS.MONITORING]: 0, [AGENTS.HOTSPOT]: 0, [AGENTS.SOURCE]: 0, [AGENTS.HEALTH]: 0, [AGENTS.ENVIRONMENTAL]: 0 };

function logAgent(agentId, action, input, output, durationMs) {
  const entry = {
    id: `${agentId}_${Date.now()}`,
    agent: agentId,
    agentName: AGENT_META[agentId]?.name,
    action,
    input: typeof input === 'object' ? JSON.stringify(input).slice(0, 200) : String(input).slice(0, 200),
    output: typeof output === 'string' ? output.slice(0, 300) : JSON.stringify(output).slice(0, 300),
    durationMs,
    timestamp: new Date().toISOString(),
    success: true,
  };
  agentLog.unshift(entry);
  if (agentLog.length > 50) agentLog.pop();
  agentCallCount[agentId] = (agentCallCount[agentId] || 0) + 1;
  return entry;
}

export function getAgentLog() { return [...agentLog]; }
export function getAgentCallCounts() { return { ...agentCallCount }; }

// ── 1. Air Quality Monitoring Agent ─────────────────────────────────────────

export async function runMonitoringAgent(locationData) {
  const t0 = Date.now();
  const { aqi, pm25, pm10, no2, so2, co, location, city } = locationData;
  const loc = location || city || 'Unknown';

  const result = {
    location: loc,
    aqi: Number(aqi),
    aqiCategory: getAqiCategory(aqi),
    pollutants: { pm25, pm10, no2, so2, co },
    alerts: [],
    weatherImpact: analyzeWeatherImpact(locationData),
    lastUpdated: new Date().toISOString(),
  };

  // Generate alerts
  if (pm25 > 60) result.alerts.push({ type: 'PM2.5', severity: 'high', message: `PM2.5 (${pm25} μg/m³) exceeds CPCB standard of 60 μg/m³` });
  if (pm10 > 100) result.alerts.push({ type: 'PM10', severity: 'medium', message: `PM10 (${pm10} μg/m³) elevated above 100 μg/m³` });
  if (no2 > 80) result.alerts.push({ type: 'NO2', severity: 'high', message: `NO2 (${no2} μg/m³) above safe threshold` });
  if (aqi > 200) result.alerts.push({ type: 'AQI', severity: 'critical', message: `AQI ${aqi} — POOR air quality. Health risk for all.` });

  // AI analysis
  try {
    const aiAnalysis = await analyzeAirQuality(locationData);
    result.aiAnalysis = aiAnalysis;
  } catch { result.aiAnalysis = `Monitoring ${loc}: AQI ${aqi} (${result.aqiCategory}). ${result.alerts.length} active alert(s).`; }

  logAgent(AGENTS.MONITORING, 'analyze_air_quality', { location: loc, aqi }, result, Date.now() - t0);
  return result;
}

// ── 2. Pollution Hotspot Analysis Agent ─────────────────────────────────────

export async function runHotspotAgent(hotspots) {
  const t0 = Date.now();

  const ranked = hotspots
    .map(h => ({
      ...h,
      score: calculateHotspotScore(h),
      trend: generateTrend(),
      primaryCause: identifyPrimaryCause(h),
    }))
    .sort((a, b) => b.score - a.score);

  const result = {
    hotspots: ranked,
    mostPolluted: ranked[0],
    hotspotCount: ranked.filter(h => h.aqi > 150).length,
    summary: `Analyzed ${ranked.length} Bengaluru locations. ${ranked.filter(h => h.aqi > 200).length} in POOR category. Top hotspot: ${ranked[0]?.name || 'N/A'} (AQI: ${ranked[0]?.aqi || 'N/A'}).`,
  };

  logAgent(AGENTS.HOTSPOT, 'rank_hotspots', { count: hotspots.length }, result.summary, Date.now() - t0);
  return result;
}

function calculateHotspotScore(h) {
  return (h.aqi || 0) * 0.4 + (h.pm25 || 0) * 0.3 + (h.pm10 || 0) * 0.2 + (h.no2 || 0) * 0.1;
}

function generateTrend() {
  const trends = ['⬆️ Worsening', '➡️ Stable', '⬇️ Improving', '⬆️ Sharply Rising'];
  return trends[Math.floor(Math.random() * trends.length)];
}

function identifyPrimaryCause(h) {
  const name = (h.name || '').toLowerCase();
  if (name.includes('peenya') || name.includes('industrial')) return 'Industrial Emissions';
  if (name.includes('silk board') || name.includes('junction') || name.includes('ring road')) return 'Traffic Congestion';
  if (name.includes('whitefield') || name.includes('itpl') || name.includes('tech park')) return 'IT Corridor Traffic';
  if (name.includes('bellandur') || name.includes('lake')) return 'Lake Pollution + Traffic';
  if (name.includes('airport') || name.includes('tumkur')) return 'Highway Vehicles';
  if (name.includes('construction')) return 'Construction Dust';
  return h.primarySource || 'Mixed Urban Pollution';
}

// ── 3. Pollution Source Intelligence Agent ─────────────────────────────────

export async function runSourceAgent(locationData, hotspots) {
  const t0 = Date.now();
  const loc = locationData.location || locationData.city || 'Bengaluru';
  const hour = new Date().getHours();
  const isRushHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);

  const sources = identifyPollutionSources(locationData, isRushHour);
  const constructionZones = identifyConstructionZones(hotspots);
  const trafficImpact = isRushHour ? 'High' : 'Moderate';

  const result = {
    location: loc,
    sources,
    constructionZones,
    trafficImpact,
    weatherInfluence: analyzeWeatherInfluence(locationData),
    recommendations: generateSourceRecommendations(sources),
    isRushHour,
  };

  logAgent(AGENTS.SOURCE, 'identify_sources', { location: loc }, result, Date.now() - t0);
  return result;
}

function identifyPollutionSources(data, isRushHour) {
  const sources = [];
  const aqi = Number(data.aqi) || 0;

  if (data.no2 > 40) sources.push({ type: 'Vehicular Emissions', contribution: 35, severity: data.no2 > 60 ? 'High' : 'Medium', pollutant: 'NO2, CO' });
  if (data.pm10 > 80) sources.push({ type: 'Road Dust', contribution: 20, severity: 'Medium', pollutant: 'PM10' });
  if (data.so2 > 20) sources.push({ type: 'Industrial Emissions', contribution: 25, severity: data.so2 > 35 ? 'High' : 'Medium', pollutant: 'SO2, PM2.5' });
  if (data.pm25 > 50) sources.push({ type: 'Construction Activity', contribution: 15, severity: 'Medium', pollutant: 'PM2.5, PM10' });
  if (isRushHour) sources.push({ type: 'Peak Hour Traffic', contribution: 30, severity: 'High', pollutant: 'NO2, CO, PM2.5' });
  sources.push({ type: 'Biomass Burning', contribution: 5, severity: 'Low', pollutant: 'PM2.5' });

  return sources.sort((a, b) => b.contribution - a.contribution);
}

function identifyConstructionZones(hotspots) {
  return (hotspots || []).slice(0, 3).map(h => ({
    name: h.name,
    dustLevel: h.pm10 > 100 ? 'High' : 'Moderate',
    affectedRadius: '500m',
  }));
}

function analyzeWeatherInfluence(data) {
  const wind = data.windSpeed || 5;
  const humidity = data.humidity || 60;
  if (wind > 10) return 'Strong winds dispersing pollutants — improving conditions';
  if (wind < 3) return 'Calm winds — pollutants accumulating locally';
  if (humidity > 80) return 'High humidity — PM particles growing, reducing visibility';
  return 'Normal weather conditions';
}

function generateSourceRecommendations(sources) {
  return sources.slice(0, 3).map(s => `Reduce ${s.type}: ${
    s.type.includes('Vehicular') ? 'Encourage EV adoption and carpooling' :
    s.type.includes('Dust') ? 'Water spraying and road cleaning' :
    s.type.includes('Industrial') ? 'Enforce emission standards' :
    s.type.includes('Construction') ? 'Dust suppression nets and barriers required' :
    'Monitor and regulate'
  }`);
}

function analyzeWeatherInfluence2(data) {
  return analyzeWeatherInfluence(data);
}

// ── 4. Citizen Health & AirSafe Journey Agent ─────────────────────────────

export async function runHealthAgent(aqiData, healthProfile = 'adults') {
  const t0 = Date.now();
  const aqi = Number(aqiData.aqi) || 0;
  const loc = aqiData.location || aqiData.city || 'this area';

  const riskLevel = getProfileRisk(healthProfile, aqi);
  const precautions = getHealthPrecautions(healthProfile, aqi);
  const outdoorAdvice = getOutdoorAdvice(aqi);
  const maskRecommendation = aqi > 100 ? 'N95/N99 mask strongly recommended' : aqi > 50 ? 'Mask recommended for sensitive groups' : 'Mask optional';

  const result = {
    location: loc,
    healthProfile,
    riskLevel,
    precautions,
    outdoorAdvice,
    maskRecommendation,
    emergencyNote: aqi > 300 ? '🚨 EMERGENCY: Seek medical attention if experiencing breathing difficulty' : null,
    bestTimeToGo: getBestTimeToGo(aqiData),
  };

  logAgent(AGENTS.HEALTH, 'health_advisory', { location: loc, profile: healthProfile, aqi }, result, Date.now() - t0);
  return result;
}

export async function runJourneyAgent(origin, destination, healthProfile) {
  const t0 = Date.now();
  // All routing logic is in the backend — it uses real coordinates, ORS routing,
  // and geometric hotspot filtering. Never use hardcoded static lists here.
  const result = await analyzeRoute(origin, destination, healthProfile);
  logAgent(AGENTS.HEALTH, 'journey_planning', { origin, destination, profile: healthProfile }, result, Date.now() - t0);
  return result;
}

function getProfileRisk(profile, aqi) {
  const thresholds = {
    children: [50, 100, 150],
    elderly:  [50, 100, 150],
    asthma:   [30, 60,  100],
    cardiac:  [50, 100, 150],
    adults:   [100, 200, 300],
  };
  const t = thresholds[profile] || thresholds.adults;
  if (aqi <= t[0]) return { level: 'Low',      color: '#22C55E', label: '🟢 Low Risk' };
  if (aqi <= t[1]) return { level: 'Moderate', color: '#EAB308', label: '🟡 Moderate Risk' };
  if (aqi <= t[2]) return { level: 'High',     color: '#F97316', label: '🟠 High Risk' };
  return { level: 'Critical', color: '#EF4444', label: '🔴 Critical Risk' };
}

function getHealthPrecautions(profile, aqi) {
  const base = aqi > 200 ? [
    'Stay indoors with windows closed',
    'Use air purifier if available',
    'Wear N95 mask if going outside',
    'Avoid strenuous physical activity',
    'Keep emergency medication handy',
  ] : aqi > 100 ? [
    'Limit outdoor exposure during peak hours (7–10am, 5–9pm)',
    'Wear mask for outdoor activities',
    'Keep windows closed during traffic hours',
    'Hydrate well — helps body cope with pollutants',
  ] : [
    'Air quality acceptable for most activities',
    'Avoid heavy exercise near traffic-heavy roads',
    'Short outdoor exposure is fine',
  ];

  const extra = {
    children: ['Keep children indoors if AQI > 100', 'No outdoor school activities when AQI > 150'],
    elderly:  ['Carry prescribed inhalers/medicines', 'Avoid morning walks during high-AQI periods'],
    asthma:   ['Pre-medicate before going out', 'Avoid known pollution hotspots like Peenya, Silk Board'],
    cardiac:  ['Monitor pulse if outdoors', 'Avoid exertion in polluted areas'],
    adults:   ['Healthy adults can tolerate moderate levels with precautions'],
  };
  return [...base, ...(extra[profile] || [])];
}

function getOutdoorAdvice(aqi) {
  if (aqi <= 50)  return 'Excellent for outdoor activities';
  if (aqi <= 100) return 'Good for most people, sensitive groups should moderate';
  if (aqi <= 200) return 'Reduce prolonged outdoor exertion';
  if (aqi <= 300) return 'Avoid outdoor activities for sensitive groups';
  return 'Everyone should avoid outdoor activities';
}

function getBestTimeToGo(data) {
  const hour = new Date().getHours();
  return {
    best: '11:00 AM – 3:00 PM',
    avoid: '7:00 AM – 10:00 AM and 5:00 PM – 9:00 PM',
    reason: 'Traffic peaks cause 25–40% higher AQI during rush hours in Bengaluru',
    currentHour: `${hour}:00`,
    isCurrentPeakHour: (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21),
  };
}

function identifyRouteHotspots(origin, destination) {
  const knownHotspots = ['Silk Board', 'Outer Ring Road', 'KR Puram', 'Peenya', 'Hebbal', 'Marathahalli'];
  const originLC = origin.toLowerCase();
  const destLC = destination.toLowerCase();

  const relevant = knownHotspots.filter(h => {
    const hl = h.toLowerCase();
    return !originLC.includes(hl) && !destLC.includes(hl);
  }).slice(0, 3);

  return relevant.map(h => ({
    name: h,
    aqi: 140 + Math.floor(Math.random() * 80),
    warning: 'High traffic pollution zone',
  }));
}

function generateAlternatives(origin, destination) {
  return [
    { route: 'Via Metro / Namma Metro', pollutionReduction: '40–60%', duration: '+10–15 min', recommended: true },
    { route: 'Inner roads (avoid ORR)', pollutionReduction: '15–25%', duration: '+5–10 min', recommended: false },
  ];
}

function estimateTravelTime(origin, destination) {
  const hour = new Date().getHours();
  const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
  return { base: '20–35 min', peak: '45–90 min', offPeak: '15–25 min', current: isPeak ? 'Peak hour — expect delays' : 'Normal traffic conditions' };
}

// ── 5. Environmental Intelligence Agent (Supervisor) ─────────────────────

export async function runEnvironmentalAgent(allData) {
  const t0 = Date.now();
  const { locationData, hotspots, monitoring, source } = allData;

  const constructionAlerts = generateConstructionAlerts(hotspots);
  const dustAlerts = generateDustAlerts(hotspots);
  const environmentalScore = calculateEnvironmentalScore(locationData);
  const recommendations = generateEnvironmentalRecommendations(locationData, source);

  const result = {
    environmentalScore,
    constructionAlerts,
    dustAlerts,
    recommendations,
    agentCoordination: {
      monitoring: monitoring ? 'Active ✓' : 'Idle',
      hotspot: hotspots?.length > 0 ? 'Active ✓' : 'Idle',
      source: source ? 'Active ✓' : 'Idle',
      health: 'Standby',
    },
    summary: `Environmental Intelligence: Score ${environmentalScore}/100. ${constructionAlerts.length} construction alerts. ${dustAlerts.length} dust warnings. ${recommendations.length} action items.`,
  };

  logAgent(AGENTS.ENVIRONMENTAL, 'environmental_assessment', { location: locationData?.city }, result, Date.now() - t0);
  return result;
}

function generateConstructionAlerts(hotspots) {
  const zones = ['Peripheral Ring Road', 'Namma Metro Phase 2', 'Elevated Corridor ORR', 'BMRDA Projects'];
  return zones.slice(0, 2).map(z => ({
    zone: z,
    dustLevel: 'High',
    pm10Impact: '+30–50 μg/m³',
    radius: '500m',
    recommendation: 'Water spraying every 2 hours required',
  }));
}

function generateDustAlerts(hotspots) {
  return (hotspots || [])
    .filter(h => h.pm10 > 100)
    .slice(0, 3)
    .map(h => ({
      location: h.name,
      pm10: h.pm10,
      severity: h.pm10 > 150 ? 'High' : 'Moderate',
      action: 'Mechanical road sweeping and water spraying required',
    }));
}

function calculateEnvironmentalScore(data) {
  const aqi = Number(data?.aqi) || 150;
  return Math.max(0, Math.min(100, Math.round(100 - aqi / 5)));
}

function generateEnvironmentalRecommendations(data, source) {
  const recs = [];
  if (data?.aqi > 150) recs.push('Issue public health advisory for affected zones');
  if (data?.no2 > 50) recs.push('Increase traffic management at congested junctions');
  if (data?.pm10 > 100) recs.push('Deploy mechanical road sweepers in dust-affected areas');
  recs.push('Increase green cover and tree plantation drives');
  recs.push('Promote EV adoption and public transport usage');
  recs.push('Conduct real-time monitoring at known hotspots');
  return recs;
}

// ── Orchestrator ─────────────────────────────────────────────────────────

export async function orchestrateAgents(locationData, hotspots = []) {
  const t0 = Date.now();
  logAgent(AGENTS.ENVIRONMENTAL, 'orchestrate_agents', { location: locationData?.city }, 'Starting multi-agent workflow', 0);

  const [monitoring, hotspotResult, source] = await Promise.all([
    runMonitoringAgent(locationData),
    runHotspotAgent(hotspots.length > 0 ? hotspots : [locationData]),
    runSourceAgent(locationData, hotspots),
  ]);

  const health = await runHealthAgent(locationData, 'adults');
  const environmental = await runEnvironmentalAgent({ locationData, hotspots, monitoring, source });

  logAgent(AGENTS.ENVIRONMENTAL, 'workflow_complete', { agents: 5 }, `All 5 agents completed in ${Date.now() - t0}ms`, Date.now() - t0);

  return { monitoring, hotspot: hotspotResult, source, health, environmental };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getAqiCategory(aqi) {
  const v = Number(aqi);
  if (v <= 50) return 'Good';
  if (v <= 100) return 'Satisfactory';
  if (v <= 200) return 'Moderate';
  if (v <= 300) return 'Poor';
  if (v <= 400) return 'Very Poor';
  return 'Severe';
}

function analyzeWeatherImpact(data) {
  const wind = data.windSpeed || 5;
  const humidity = data.humidity || 60;
  if (wind > 15) return 'High wind speed dispersing pollutants — improving';
  if (wind < 3 && humidity > 75) return 'Stagnant air + high humidity — pollutants trapped';
  if (humidity > 80) return 'High humidity affecting PM particle size';
  return 'Normal weather conditions';
}
