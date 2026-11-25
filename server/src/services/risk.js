import { clamp, isNum, ramp, round } from '../lib/utils.js';

const WEIGHTS = {
  air: 0.35,
  heat: 0.2,
  rain: 0.2,
  wind: 0.15,
  uv: 0.1,
};

const LEVELS = [
  {
    key: 'low',
    label: 'Low',
    max: 25,
    color: '#22A06B',
    advice: 'Conditions are generally favourable. Normal outdoor activity is fine.',
  },
  {
    key: 'moderate',
    label: 'Moderate',
    max: 50,
    color: '#F2C14E',
    advice: 'Some environmental stress is present. Sensitive people should take sensible precautions.',
  },
  {
    key: 'high',
    label: 'High',
    max: 75,
    color: '#F08A3C',
    advice: 'Plan outdoor activity carefully and reduce exposure during peak pollution or heat hours.',
  },
  {
    key: 'severe',
    label: 'Severe',
    max: 101,
    color: '#E05252',
    advice: 'Limit outdoor exposure, keep indoor air clean and follow official health advisories.',
  },
];

export function riskLevel(score) {
  if (!isNum(score)) return LEVELS[0];
  return LEVELS.find((level) => Number(score) < level.max) || LEVELS[LEVELS.length - 1];
}

function buildComponents({ tempMax, rainSum, windMax, uvMax, aqiValue, aqiCategory, aqiDominant }) {
  const components = [
    {
      key: 'air',
      label: 'Air quality',
      weight: WEIGHTS.air,
      value: isNum(aqiValue) ? clamp(((Number(aqiValue) - 20) / 380) * 100, 0, 100) : 0,
      available: isNum(aqiValue),
      detail: isNum(aqiValue)
        ? `Estimated AQI ${aqiValue}${aqiCategory ? ` · ${aqiCategory}` : ''}${aqiDominant ? ` · ${aqiDominant} dominant` : ''}`
        : 'Air-quality data unavailable',
    },
    {
      key: 'heat',
      label: 'Heat stress',
      weight: WEIGHTS.heat,
      value: ramp(tempMax, 30, 45),
      available: isNum(tempMax),
      detail: isNum(tempMax) ? `${tempMax} °C maximum` : 'Temperature unavailable',
    },
    {
      key: 'rain',
      label: 'Rain & flood',
      weight: WEIGHTS.rain,
      value: ramp(rainSum, 5, 120),
      available: isNum(rainSum),
      detail: isNum(rainSum) ? `${rainSum} mm forecast today` : 'Rainfall unavailable',
    },
    {
      key: 'wind',
      label: 'Wind',
      weight: WEIGHTS.wind,
      value: ramp(windMax, 20, 90),
      available: isNum(windMax),
      detail: isNum(windMax) ? `${windMax} km/h maximum` : 'Wind data unavailable',
    },
    {
      key: 'uv',
      label: 'UV exposure',
      weight: WEIGHTS.uv,
      value: ramp(uvMax, 3, 11),
      available: isNum(uvMax),
      detail: isNum(uvMax) ? `UV index ${uvMax}` : 'UV data unavailable',
    },
  ];

  const available = components.filter((component) => component.available);
  const totalWeight = available.reduce((sum, component) => sum + component.weight, 0) || 1;

  return components.map((component) => ({
    ...component,
    value: round(component.value, 0),
    contribution: round(component.available ? (component.value * component.weight * 100) / totalWeight : 0, 1),
  }));
}

function scoreFrom(components) {
  const available = components.filter((component) => component.available);
  const totalWeight = available.reduce((sum, component) => sum + component.weight, 0);
  if (!totalWeight) return 0;
  const weighted = available.reduce((sum, component) => sum + component.value * component.weight, 0);
  return Math.round(weighted / totalWeight);
}

/**
 * Composite environmental risk for today and the 7-day outlook.
 * This is a transparent, heuristic index for awareness — not a scientific or
 * official risk assessment.
 */
export function computeRisk({ weather, air }) {
  const today = weather?.daily?.[0] || {};
  const aqi = air?.aqi;

  const components = buildComponents({
    tempMax: today.tempMax,
    rainSum: today.precipitationSum,
    windMax: today.windMax,
    uvMax: today.uvMax,
    aqiValue: aqi?.value,
    aqiCategory: aqi?.category,
    aqiDominant: aqi?.dominantLabel,
  });

  const score = scoreFrom(components);
  const level = riskLevel(score);

  const drivers = components
    .filter((component) => component.available && component.value >= 20)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  const summary = drivers.length
    ? `Overall environmental risk is ${level.label.toLowerCase()} (${score}/100). ${drivers[0].label} is the largest contributor: ${drivers[0].detail.toLowerCase()}.`
    : `Overall environmental risk is ${level.label.toLowerCase()} (${score}/100), with no single dominant stress factor in today's forecast.`;

  const daily = (weather?.daily || []).map((day) => {
    const airForDay = air?.daily?.find((row) => row.date === day.date);
    const dayComponents = buildComponents({
      tempMax: day.tempMax,
      rainSum: day.precipitationSum,
      windMax: day.windMax,
      uvMax: day.uvMax,
      aqiValue: airForDay?.aqiMax ?? (day.date === today.date ? aqi?.value : null),
      aqiCategory: airForDay?.category ?? (day.date === today.date ? aqi?.category : null),
    });
    const dayScore = scoreFrom(dayComponents);
    const dayLevel = riskLevel(dayScore);
    return {
      date: day.date,
      score: dayScore,
      level: dayLevel.label,
      levelKey: dayLevel.key,
      color: dayLevel.color,
    };
  });

  return {
    score,
    level: level.label,
    levelKey: level.key,
    color: level.color,
    advice: level.advice,
    summary,
    components,
    drivers,
    daily,
    method:
      'Weighted heuristic: air quality 35%, heat 20%, rain/flood 20%, wind 15%, UV 10%. Weights are re-normalised when a data source is unavailable.',
    disclaimer:
      'An awareness indicator created for this project, not an official risk rating. Always check IMD and CPCB advisories for decisions that affect safety.',
  };
}
