import { clamp, isNum, numOrNull, round } from '../lib/utils.js';

/**
 * CPCB (Central Pollution Control Board, India) National Air Quality Index.
 *
 * IMPORTANT — honesty rules used throughout the app:
 *  - Open-Meteo's Air Quality API provides CAMS *model* concentrations, not
 *    CPCB monitoring-station data. It also provides a US AQI value, which we
 *    deliberately do NOT display as the primary index (mixing AQI standards is
 *    misleading).
 *  - The AQI shown by WeatherGPT is therefore an ESTIMATE: CPCB breakpoints are
 *    applied to instantaneous / hourly model concentrations. Official CPCB AQI
 *    uses 24-hour averages for PM2.5, PM10, NO2 and SO2, and 8-hour averages for
 *    CO and O3.
 */

export const AQI_STANDARD = {
  id: 'cpcb-in',
  name: 'CPCB India National AQI',
  scale: '0–500',
  reference: 'https://cpcb.nic.in/national-air-quality-index/',
  averaging:
    'Official CPCB AQI uses 24-hour averages (PM2.5, PM10, NO2, SO2) and 8-hour averages (CO, O3).',
  note:
    'Estimated by WeatherGPT from Open-Meteo CAMS model concentrations using CPCB breakpoints. Not an official CPCB station reading.',
};

/** Concentration breakpoints: [concLow, concHigh, aqiLow, aqiHigh]. CO is mg/m³. */
const BREAKPOINTS = {
  pm25: {
    label: 'PM2.5',
    unit: 'µg/m³',
    averaging: '24-hour average',
    standard: 60,
    points: [
      [0, 30, 0, 50],
      [30, 60, 51, 100],
      [60, 90, 101, 200],
      [90, 120, 201, 300],
      [120, 250, 301, 400],
      [250, 500, 401, 500],
    ],
  },
  pm10: {
    label: 'PM10',
    unit: 'µg/m³',
    averaging: '24-hour average',
    standard: 100,
    points: [
      [0, 50, 0, 50],
      [50, 100, 51, 100],
      [100, 250, 101, 200],
      [250, 350, 201, 300],
      [350, 430, 301, 400],
      [430, 600, 401, 500],
    ],
  },
  no2: {
    label: 'NO₂',
    unit: 'µg/m³',
    averaging: '24-hour average',
    standard: 80,
    points: [
      [0, 40, 0, 50],
      [40, 80, 51, 100],
      [80, 180, 101, 200],
      [180, 280, 201, 300],
      [280, 400, 301, 400],
      [400, 800, 401, 500],
    ],
  },
  so2: {
    label: 'SO₂',
    unit: 'µg/m³',
    averaging: '24-hour average',
    standard: 80,
    points: [
      [0, 40, 0, 50],
      [40, 80, 51, 100],
      [80, 380, 101, 200],
      [380, 800, 201, 300],
      [800, 1600, 301, 400],
      [1600, 2000, 401, 500],
    ],
  },
  co: {
    label: 'CO',
    unit: 'mg/m³',
    averaging: '8-hour average',
    standard: 2,
    points: [
      [0, 1, 0, 50],
      [1, 2, 51, 100],
      [2, 10, 101, 200],
      [10, 17, 201, 300],
      [17, 34, 301, 400],
      [34, 50, 401, 500],
    ],
  },
  o3: {
    label: 'O₃',
    unit: 'µg/m³',
    averaging: '8-hour average',
    standard: 100,
    points: [
      [0, 50, 0, 50],
      [50, 100, 51, 100],
      [100, 168, 101, 200],
      [168, 208, 201, 300],
      [208, 748, 301, 400],
      [748, 1000, 401, 500],
    ],
  },
};

export const AQI_CATEGORIES = [
  {
    key: 'good',
    label: 'Good',
    min: 0,
    max: 50,
    color: '#22A06B',
    short: 'Minimal impact',
    health:
      'Air quality is considered satisfactory. Enjoy normal outdoor activities.',
    environment:
      'Little or no risk to vegetation and visibility. A good day to spend time outdoors.',
    sensitive: 'No special precautions needed for the general public.',
  },
  {
    key: 'satisfactory',
    label: 'Satisfactory',
    min: 51,
    max: 100,
    color: '#7CB342',
    short: 'Minor discomfort possible',
    health:
      'Air quality is acceptable. Very sensitive people may notice mild discomfort such as throat irritation after long outdoor exposure.',
    environment:
      'Slight haze possible. Sensitive plants and ecosystems are unlikely to be affected.',
    sensitive:
      'People with asthma or other respiratory conditions should monitor how they feel during prolonged outdoor exertion.',
  },
  {
    key: 'moderate',
    label: 'Moderate',
    min: 101,
    max: 200,
    color: '#F2C14E',
    short: 'Sensitive groups affected',
    health:
      'People with asthma, heart or lung disease, children and older adults may experience breathing discomfort. Reduce prolonged or heavy outdoor exertion.',
    environment:
      'Reduced visibility and a visible haze are likely. Fine particles can settle on leaves and surfaces.',
    sensitive:
      'Sensitive groups should keep reliever medication handy and take breaks indoors.',
  },
  {
    key: 'poor',
    label: 'Poor',
    min: 201,
    max: 300,
    color: '#F08A3C',
    short: 'Health alert for sensitive groups',
    health:
      'Breathing discomfort is likely for many people, especially those with existing heart or lung conditions. Avoid prolonged outdoor exertion.',
    environment:
      'Noticeable haze and reduced visibility. Dust and smoke may affect nearby vegetation and water bodies.',
    sensitive:
      'Sensitive groups should stay indoors where possible and use a well-fitted mask if going out is unavoidable.',
  },
  {
    key: 'very-poor',
    label: 'Very Poor',
    min: 301,
    max: 400,
    color: '#E05252',
    short: 'Health alert for everyone',
    health:
      'Respiratory illness is possible with prolonged exposure. Everyone should avoid outdoor exertion; sensitive groups should remain indoors.',
    environment:
      'Heavy haze, poor visibility and possible effects on crops and ecosystems.',
    sensitive:
      'Keep windows closed during peak pollution hours. Use clean indoor air where available.',
  },
  {
    key: 'severe',
    label: 'Severe',
    min: 401,
    max: 500,
    color: '#8E2A2A',
    short: 'Emergency conditions',
    health:
      'Serious health effects are possible for everyone even with light activity. Remain indoors and avoid all outdoor exertion.',
    environment:
      'Severe haze and environmental stress. Follow local authority instructions.',
    sensitive:
      'Follow official health and school advisories. Seek medical help if you experience chest pain or severe breathlessness.',
  },
];

export function aqiCategory(value) {
  if (!isNum(value)) return null;
  const aqi = clamp(Number(value), 0, 500);
  return AQI_CATEGORIES.find((c) => aqi >= c.min && aqi <= c.max) || AQI_CATEGORIES[5];
}

export function aqiColor(value) {
  return aqiCategory(value)?.color || '#8AA39B';
}

export const POLLUTANT_INFO = Object.fromEntries(
  Object.entries(BREAKPOINTS).map(([key, config]) => [
    key,
    {
      key,
      label: config.label,
      unit: config.unit,
      standard: config.standard,
      averaging: config.averaging,
    },
  ])
);

/** Linear interpolation inside a CPCB breakpoint row. */
function subIndex(points, concentration) {
  const value = Math.max(0, Number(concentration));
  for (const [cLow, cHigh, iLow, iHigh] of points) {
    if (value <= cHigh) {
      const span = cHigh - cLow;
      if (span <= 0) return iHigh;
      return Math.round(iLow + ((value - cLow) / span) * (iHigh - iLow));
    }
  }
  return 500;
}

/**
 * @param {{pm25?:number, pm10?:number, no2?:number, so2?:number, co?:number, o3?:number}} pollutants
 *        All concentrations in µg/m³ (Open-Meteo's unit). CO is converted to mg/m³ internally.
 */
export function computeAqi(pollutants = {}) {
  const coMg = isNum(pollutants.co) ? Number(pollutants.co) / 1000 : null;

  const concentrations = {
    pm25: numOrNull(pollutants.pm25),
    pm10: numOrNull(pollutants.pm10),
    no2: numOrNull(pollutants.no2),
    so2: numOrNull(pollutants.so2),
    co: coMg === null ? null : round(coMg, 2),
    o3: numOrNull(pollutants.o3),
  };

  const subIndices = [];
  for (const [key, config] of Object.entries(BREAKPOINTS)) {
    const concentration = concentrations[key];
    if (!isNum(concentration)) continue;
    subIndices.push({
      key,
      label: config.label,
      unit: config.unit,
      concentration: round(concentration, key === 'co' ? 2 : 1),
      subIndex: subIndex(config.points, concentration),
      standard: config.standard,
      averaging: config.averaging,
    });
  }

  if (!subIndices.length) return null;

  const dominant = subIndices.reduce((a, b) => (b.subIndex > a.subIndex ? b : a));
  const value = dominant.subIndex;
  const category = aqiCategory(value);

  return {
    value,
    category: category.label,
    categoryKey: category.key,
    color: category.color,
    dominant: dominant.key,
    dominantLabel: dominant.label,
    dominantConcentration: dominant.concentration,
    dominantUnit: dominant.unit,
    subIndices: subIndices.sort((a, b) => b.subIndex - a.subIndex),
    standard: AQI_STANDARD,
    health: category.health,
    environment: category.environment,
    sensitive: category.sensitive,
    estimated: true,
  };
}

/** Group hourly air-quality rows into daily max/mean values (for charts). */
export function summariseAirByDay(hourly = []) {
  const days = new Map();
  for (const row of hourly) {
    const date = row.time?.slice(0, 10);
    if (!date) continue;
    if (!days.has(date)) {
      days.set(date, { date, aqi: [], pm25: [], pm10: [], o3: [] });
    }
    const bucket = days.get(date);
    if (isNum(row.aqi)) bucket.aqi.push(Number(row.aqi));
    if (isNum(row.pm25)) bucket.pm25.push(Number(row.pm25));
    if (isNum(row.pm10)) bucket.pm10.push(Number(row.pm10));
    if (isNum(row.o3)) bucket.o3.push(Number(row.o3));
  }

  return [...days.values()].map((bucket) => {
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const aqiMax = bucket.aqi.length ? Math.max(...bucket.aqi) : null;
    const category = aqiCategory(aqiMax);
    return {
      date: bucket.date,
      aqiMax,
      aqiMean: round(avg(bucket.aqi), 0),
      category: category?.label || null,
      categoryKey: category?.key || null,
      pm25: round(avg(bucket.pm25), 1),
      pm10: round(avg(bucket.pm10), 1),
      o3: round(avg(bucket.o3), 1),
    };
  });
}

export { BREAKPOINTS };
