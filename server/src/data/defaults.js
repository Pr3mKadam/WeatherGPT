export const DEFAULT_THRESHOLDS = {
  heavyRainMm: 64.5,
  veryHeavyRainMm: 115.6,
  hourlyRainMm: 7.5,
  heatwaveC: 40,
  severeHeatC: 45,
  strongWindKmh: 50,
  aqiPoor: 201,
  aqiVeryPoor: 301,
  uvHigh: 8,
};

export const THRESHOLD_LIMITS = {
  heavyRainMm: [10, 300],
  veryHeavyRainMm: [20, 400],
  hourlyRainMm: [2, 40],
  heatwaveC: [30, 50],
  severeHeatC: [35, 52],
  strongWindKmh: [20, 150],
  aqiPoor: [101, 400],
  aqiVeryPoor: [201, 500],
  uvHigh: [3, 12],
};

export const DEFAULT_LOCATION = {
  name: 'Pune',
  admin1: 'Maharashtra',
  country: 'India',
  lat: 18.5196,
  lon: 73.8554,
  timezone: 'Asia/Kolkata',
};

export const DEFAULT_SETTINGS = {
  thresholds: { ...DEFAULT_THRESHOLDS },
  units: 'metric',
  defaultLocation: { ...DEFAULT_LOCATION },
  aiTone: 'concise',
};

export const REPORT_KINDS = ['weather', 'air', 'risk', 'analysis', 'climate', 'custom'];

/** Merge a stored settings document with defaults, dropping unknown shapes. */
export function mergeSettings(stored) {
  const value = stored || {};
  return {
    thresholds: { ...DEFAULT_THRESHOLDS, ...(value.thresholds || {}) },
    units: 'metric',
    defaultLocation: { ...DEFAULT_LOCATION, ...(value.defaultLocation || {}) },
    aiTone: ['concise', 'detailed', 'friendly'].includes(value.aiTone) ? value.aiTone : 'concise',
    updatedAt: value.updatedAt || null,
  };
}
