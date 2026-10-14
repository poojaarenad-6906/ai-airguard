// AQI utility helpers

export const AQI_LEVELS = [
  {
    min: 1,
    max: 1,
    label: 'Good',
    color: '#4CAF50',
    bg: 'rgba(76,175,80,0.15)',
    border: 'rgba(76,175,80,0.5)',
    description: 'Air quality is satisfactory with little to no risk.',
  },
  {
    min: 2,
    max: 2,
    label: 'Fair',
    color: '#8BC34A',
    bg: 'rgba(139,195,74,0.15)',
    border: 'rgba(139,195,74,0.5)',
    description: 'Air quality is acceptable. Sensitive groups may experience minor effects.',
  },
  {
    min: 3,
    max: 3,
    label: 'Moderate',
    color: '#FFC107',
    bg: 'rgba(255,193,7,0.15)',
    border: 'rgba(255,193,7,0.5)',
    description: 'Sensitive individuals should reduce prolonged outdoor exertion.',
  },
  {
    min: 4,
    max: 4,
    label: 'Poor',
    color: '#FF5722',
    bg: 'rgba(255,87,34,0.15)',
    border: 'rgba(255,87,34,0.5)',
    description: 'Everyone may begin to experience adverse health effects.',
  },
  {
    min: 5,
    max: 5,
    label: 'Very Poor',
    color: '#B71C1C',
    bg: 'rgba(183,28,28,0.15)',
    border: 'rgba(183,28,28,0.5)',
    description: 'Health alert: everyone should avoid outdoor activity.',
  },
];

export function getAqiLevel(aqi) {
  return AQI_LEVELS.find((l) => aqi >= l.min && aqi <= l.max) || AQI_LEVELS[0];
}

export function getAqiPercentage(aqi) {
  return ((aqi - 1) / 4) * 100;
}

export const HEALTH_RECOMMENDATIONS = {
  1: {
    general: [
      'Perfect day to be outdoors!',
      'Open windows for natural ventilation.',
      'Exercise freely without any restrictions.',
      'Great time for outdoor sports and activities.',
    ],
    icon: '🌿',
  },
  2: {
    general: [
      'Outdoor activities are generally safe.',
      'Sensitive individuals may consider shorter outdoor sessions.',
      'Good air quality — enjoy your day.',
      'Stay hydrated if exercising outdoors.',
    ],
    icon: '✅',
  },
  3: {
    general: [
      'Sensitive groups should limit prolonged outdoor exertion.',
      'Consider wearing a mask during peak traffic hours.',
      'Keep windows closed during morning rush hour.',
      'Monitor symptoms if you have asthma or allergies.',
    ],
    icon: '⚠️',
  },
  4: {
    general: [
      'Reduce outdoor activities, especially intense exercise.',
      'Wear an N95 or equivalent mask outdoors.',
      'Use an air purifier indoors.',
      'Keep windows and doors closed.',
      'Check on elderly neighbours and children.',
    ],
    icon: '🚨',
  },
  5: {
    general: [
      'Avoid all unnecessary outdoor exposure.',
      'Wear a high-quality respirator mask if you must go out.',
      'Run air purifiers on maximum setting.',
      'Seal gaps in doors and windows.',
      'Seek medical attention if you experience breathing difficulty.',
      'Avoid physical exertion outdoors completely.',
    ],
    icon: '⛔',
  },
};

export const GROUP_RECOMMENDATIONS = {
  adult: {
    label: 'General Adult',
    icon: '🧑',
    tips: {
      1: ['Enjoy outdoor activities freely.', 'No special precautions needed.'],
      2: ['Normal activities are fine.', 'Stay hydrated.'],
      3: ['Limit strenuous outdoor exercise.', 'Take breaks indoors.'],
      4: ['Reduce outdoor time significantly.', 'Wear an N95 mask.'],
      5: ['Stay indoors as much as possible.', 'Avoid all outdoor exertion.'],
    },
  },
  child: {
    label: 'Children',
    icon: '👧',
    tips: {
      1: ['Children can play outdoors safely.', 'Enjoy outdoor playtime!'],
      2: ['Outdoor play is fine.', 'Watch for any unusual symptoms.'],
      3: ['Limit outdoor play time.', 'Prefer indoor activities.'],
      4: ['Keep children indoors.', 'Avoid playgrounds near roads.'],
      5: ['Do not allow outdoor play.', 'Keep windows closed in school/home.'],
    },
  },
  elderly: {
    label: 'Older Adults',
    icon: '👴',
    tips: {
      1: ['Enjoy leisurely outdoor walks.', 'Great day to get some fresh air.'],
      2: ['Light outdoor walks are fine.', 'Avoid prolonged exertion.'],
      3: ['Shorten outdoor walks.', 'Carry any prescribed inhalers.'],
      4: ['Stay indoors.', 'Use air purifiers at home.'],
      5: ['Remain indoors completely.', 'Consult your doctor if symptomatic.'],
    },
  },
  respiratory: {
    label: 'Respiratory Sensitivity',
    icon: '🫁',
    tips: {
      1: ['Conditions are good.', 'Carry inhalers as a precaution.'],
      2: ['Take your medication as prescribed.', 'Avoid heavy exertion.'],
      3: ['Carry your rescue inhaler.', 'Limit time outdoors.', 'Monitor peak flow.'],
      4: ['Stay indoors.', 'Use prescribed medications proactively.', 'Wear an N95 if going out.'],
      5: ['Do not go outdoors.', 'Consult your doctor.', 'Use air purifiers continuously.'],
    },
  },
  outdoor_worker: {
    label: 'Outdoor Worker',
    icon: '👷',
    tips: {
      1: ['Normal working conditions.', 'No additional precautions needed.'],
      2: ['Stay hydrated.', 'Take regular breaks.'],
      3: ['Wear a basic dust mask.', 'Take indoor breaks every 2 hours.'],
      4: ['Wear N95 respirator.', 'Request indoor work if possible.', 'Report discomfort to supervisor.'],
      5: ['Wear full respirator mask.', 'Seek indoor reassignment if possible.', 'Document exposure for health records.'],
    },
  },
};

export function formatPollutant(value, unit = 'μg/m³') {
  if (value === undefined || value === null) return 'N/A';
  return `${Number(value).toFixed(1)} ${unit}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
