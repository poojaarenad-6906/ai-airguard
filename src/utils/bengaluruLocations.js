/**
 * Bengaluru Locations Database
 * Comprehensive list of Bengaluru localities, layouts, landmarks, tech parks
 */

export const BENGALURU_LOCATIONS = [
  // Central
  { name: 'MG Road', lat: 12.9752, lng: 77.6061, zone: 'Central', type: 'landmark' },
  { name: 'Brigade Road', lat: 12.9718, lng: 77.6080, zone: 'Central', type: 'landmark' },
  { name: 'Commercial Street', lat: 12.9823, lng: 77.6085, zone: 'Central', type: 'landmark' },
  { name: 'Cubbon Park', lat: 12.9763, lng: 77.5929, zone: 'Central', type: 'park' },
  { name: 'Lalbagh', lat: 12.9507, lng: 77.5848, zone: 'South Central', type: 'park' },
  { name: 'Vidhana Soudha', lat: 12.9796, lng: 77.5908, zone: 'Central', type: 'landmark' },
  { name: 'City Market (KR Market)', lat: 12.9634, lng: 77.5760, zone: 'Central', type: 'market' },
  { name: 'Majestic (Kempe Gowda Bus Stand)', lat: 12.9775, lng: 77.5712, zone: 'Central', type: 'transit' },
  { name: 'Shivajinagar', lat: 12.9869, lng: 77.5990, zone: 'Central', type: 'area' },
  { name: 'Sadashivanagar', lat: 13.0042, lng: 77.5712, zone: 'North Central', type: 'area' },
  { name: 'Malleswaram', lat: 13.0027, lng: 77.5660, zone: 'North Central', type: 'area' },
  { name: 'Rajajinagar', lat: 12.9985, lng: 77.5541, zone: 'West', type: 'area' },
  { name: 'Basavanagudi', lat: 12.9418, lng: 77.5750, zone: 'South', type: 'area' },
  { name: 'Jayanagar', lat: 12.9280, lng: 77.5831, zone: 'South', type: 'area' },
  { name: 'JP Nagar', lat: 12.9105, lng: 77.5862, zone: 'South', type: 'area' },
  { name: 'Bannerghatta Road', lat: 12.8930, lng: 77.5990, zone: 'South', type: 'road' },
  { name: 'BTM Layout', lat: 12.9165, lng: 77.6101, zone: 'South', type: 'layout' },
  { name: 'Koramangala', lat: 12.9279, lng: 77.6271, zone: 'South East', type: 'area' },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6474, zone: 'South East', type: 'layout' },
  { name: 'Sarjapur Road', lat: 12.9148, lng: 77.6762, zone: 'South East', type: 'road' },
  { name: 'Electronic City', lat: 12.8456, lng: 77.6603, zone: 'South', type: 'tech-park', hotspot: true },
  { name: 'Electronic City Phase 1', lat: 12.8398, lng: 77.6628, zone: 'South', type: 'tech-park', hotspot: true },
  { name: 'Electronic City Phase 2', lat: 12.8512, lng: 77.6578, zone: 'South', type: 'tech-park', hotspot: true },
  { name: 'Bommanahalli', lat: 12.8911, lng: 77.6395, zone: 'South', type: 'area', hotspot: true },
  { name: 'Kudlu Gate', lat: 12.8961, lng: 77.6474, zone: 'South', type: 'area' },
  { name: 'Silk Board', lat: 12.9173, lng: 77.6241, zone: 'South', type: 'junction', hotspot: true },
  { name: 'Marathahalli', lat: 12.9591, lng: 77.6974, zone: 'East', type: 'area', hotspot: true },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500, zone: 'East', type: 'area', hotspot: true },
  { name: 'ITPL (Whitefield)', lat: 12.9875, lng: 77.7452, zone: 'East', type: 'tech-park' },
  { name: 'Varthur', lat: 12.9394, lng: 77.7452, zone: 'East', type: 'area' },
  { name: 'Bellandur', lat: 12.9254, lng: 77.6774, zone: 'East', type: 'area', hotspot: true },
  { name: 'Outer Ring Road (ORR)', lat: 12.9279, lng: 77.6701, zone: 'East', type: 'road', hotspot: true },
  { name: 'KR Puram', lat: 13.0057, lng: 77.7039, zone: 'East', type: 'area', hotspot: true },
  { name: 'Old Madras Road', lat: 13.0067, lng: 77.6512, zone: 'East', type: 'road' },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, zone: 'East', type: 'area' },
  { name: 'Domlur', lat: 12.9593, lng: 77.6373, zone: 'East', type: 'area' },
  { name: 'Hal Airport Road', lat: 12.9636, lng: 77.6512, zone: 'East', type: 'road' },
  { name: 'Banaswadi', lat: 13.0040, lng: 77.6530, zone: 'North East', type: 'area' },
  { name: 'Hennur', lat: 13.0362, lng: 77.6400, zone: 'North East', type: 'area' },
  { name: 'Kalyan Nagar', lat: 13.0276, lng: 77.6400, zone: 'North East', type: 'area' },
  { name: 'Kammanahalli', lat: 13.0132, lng: 77.6400, zone: 'North East', type: 'area' },
  { name: 'Frazer Town', lat: 12.9898, lng: 77.6185, zone: 'Central', type: 'area' },
  { name: 'Cox Town', lat: 12.9981, lng: 77.6185, zone: 'Central', type: 'area' },
  { name: 'Cleveland Town', lat: 12.9869, lng: 77.6185, zone: 'Central', type: 'area' },
  { name: 'Hebbal', lat: 13.0453, lng: 77.5908, zone: 'North', type: 'area', hotspot: true },
  { name: 'Manyata Tech Park', lat: 13.0453, lng: 77.6225, zone: 'North', type: 'tech-park' },
  { name: 'Nagawara', lat: 13.0453, lng: 77.6225, zone: 'North', type: 'area' },
  { name: 'Thanisandra', lat: 13.0634, lng: 77.6400, zone: 'North', type: 'area' },
  { name: 'Jakkur', lat: 13.0763, lng: 77.6185, zone: 'North', type: 'area' },
  { name: 'Yelahanka', lat: 13.1007, lng: 77.5960, zone: 'North', type: 'area' },
  { name: 'Yelahanka New Town', lat: 13.1007, lng: 77.5960, zone: 'North', type: 'area' },
  { name: 'Kempegowda International Airport', lat: 13.1986, lng: 77.7066, zone: 'North', type: 'airport' },
  { name: 'Devanahalli', lat: 13.2447, lng: 77.7147, zone: 'North', type: 'area' },
  { name: 'Peenya', lat: 13.0276, lng: 77.5202, zone: 'North West', type: 'industrial', hotspot: true },
  { name: 'Peenya Industrial Area', lat: 13.0276, lng: 77.5202, zone: 'North West', type: 'industrial', hotspot: true },
  { name: 'Yeshwanthpur', lat: 13.0169, lng: 77.5541, zone: 'North West', type: 'area' },
  { name: 'Tumkur Road', lat: 13.0169, lng: 77.5202, zone: 'North West', type: 'road', hotspot: true },
  { name: 'Jalahalli', lat: 13.0453, lng: 77.5202, zone: 'North West', type: 'area' },
  { name: 'Mathikere', lat: 13.0276, lng: 77.5541, zone: 'North West', type: 'area' },
  { name: 'Kengeri', lat: 12.9079, lng: 77.4817, zone: 'West', type: 'area' },
  { name: 'Kengeri Satellite Town', lat: 12.9079, lng: 77.4817, zone: 'West', type: 'area' },
  { name: 'Mysore Road', lat: 12.9418, lng: 77.5202, zone: 'West', type: 'road' },
  { name: 'Vijayanagar', lat: 12.9681, lng: 77.5330, zone: 'West', type: 'area' },
  { name: 'Nagarbhavi', lat: 12.9507, lng: 77.5202, zone: 'West', type: 'area' },
  { name: 'RR Nagar', lat: 12.9165, lng: 77.5202, zone: 'West', type: 'area' },
  { name: 'Uttarahalli', lat: 12.8911, lng: 77.5330, zone: 'South West', type: 'area' },
  { name: 'Banashankari', lat: 12.9280, lng: 77.5541, zone: 'South West', type: 'area' },
  { name: 'Padmanabhanagar', lat: 12.9165, lng: 77.5541, zone: 'South West', type: 'area' },
  { name: 'Wilson Garden', lat: 12.9418, lng: 77.5960, zone: 'South', type: 'area' },
  { name: 'Richmond Town', lat: 12.9593, lng: 77.6020, zone: 'South Central', type: 'area' },
  { name: 'Langford Town', lat: 12.9507, lng: 77.6020, zone: 'South Central', type: 'area' },
  { name: 'Frazer Town', lat: 12.9898, lng: 77.6185, zone: 'Central', type: 'area' },
  { name: 'Cunningham Road', lat: 12.9869, lng: 77.5960, zone: 'Central', type: 'road' },
  { name: 'Residency Road', lat: 12.9681, lng: 77.6061, zone: 'Central', type: 'road' },
  { name: 'Ashok Nagar', lat: 12.9681, lng: 77.5960, zone: 'Central', type: 'area' },
  { name: 'Shantiniketan', lat: 12.9637, lng: 77.5712, zone: 'West', type: 'area' },
  { name: 'Seshadripuram', lat: 12.9975, lng: 77.5712, zone: 'North Central', type: 'area' },
  { name: 'Gandhinagar', lat: 12.9823, lng: 77.5712, zone: 'Central', type: 'area' },
  { name: 'Srirampura', lat: 13.0027, lng: 77.5541, zone: 'North Central', type: 'area' },
  { name: 'Nandi Hills', lat: 13.3703, lng: 77.6833, zone: 'North', type: 'landmark' },
  { name: 'Bannerghatta National Park', lat: 12.8012, lng: 77.5748, zone: 'South', type: 'landmark' },
  { name: 'Doddaballapur Road', lat: 13.1007, lng: 77.5541, zone: 'North', type: 'road' },
];

/**
 * Search Bengaluru locations by query string
 * Returns up to `limit` matches sorted by relevance
 */
export function searchBengaluruLocations(query, limit = 8) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();

  const scored = BENGALURU_LOCATIONS.map(loc => {
    const name = loc.name.toLowerCase();
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else {
      // Partial word match
      const words = q.split(/\s+/);
      const matchCount = words.filter(w => name.includes(w)).length;
      score = (matchCount / words.length) * 40;
    }
    return { ...loc, score };
  }).filter(l => l.score > 0);

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Get a location by exact name (case-insensitive)
 */
export function getLocationByName(name) {
  const q = name.toLowerCase().trim();
  return BENGALURU_LOCATIONS.find(l => l.name.toLowerCase() === q)
    || BENGALURU_LOCATIONS.find(l => l.name.toLowerCase().includes(q))
    || null;
}

/**
 * Get pollution hotspots ranked by severity
 */
export function getPollutionHotspots() {
  return BENGALURU_LOCATIONS.filter(l => l.hotspot);
}
