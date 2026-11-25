import { isNum, round } from '../lib/utils.js';

const SEVERITY = {
  info: { rank: 1, label: 'Info', tone: 'info' },
  watch: { rank: 2, label: 'Watch', tone: 'watch' },
  warning: { rank: 3, label: 'Warning', tone: 'warning' },
  severe: { rank: 4, label: 'Severe', tone: 'severe' },
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayLabel(dateString, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const date = new Date(`${dateString}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? dateString : WEEKDAYS[date.getUTCDay()];
}

function makeAlert({ category, severity, title, reason, advice, value, unit, threshold, date, dayIndex, source }) {
  const severityMeta = SEVERITY[severity] || SEVERITY.watch;
  return {
    id: `${category}-${date || 'current'}-${value}`,
    category,
    severity,
    severityLabel: severityMeta.label,
    severityRank: severityMeta.rank,
    tone: severityMeta.tone,
    title,
    reason,
    advice,
    value,
    unit,
    threshold,
    date: date || null,
    day: dayIndex === undefined ? null : dayLabel(date, dayIndex),
    source,
    advisory: true,
  };
}

/**
 * Builds *computed advisories* from the forecast. These are deliberately labelled
 * as computed — never as official IMD or CPCB warnings.
 *
 * Threshold references:
 *  - IMD daily rainfall categories: heavy 64.5–115.5 mm, very heavy 115.6–204.4 mm,
 *    extremely heavy ≥204.5 mm. Intense hourly rain uses 7.5 mm/h as a watch level.
 *  - IMD heatwave: ≥40 °C in the plains (≥37 °C coastal, ≥30 °C hills).
 *  - CPCB AQI categories: Poor 201–300, Very Poor 301–400, Severe 401–500.
 */
export function buildAlerts({ weather, air, thresholds, locationName = 'this location' }) {
  const alerts = [];
  const daily = weather?.daily || [];
  const current = weather?.current || {};
  const aqi = air?.aqi;
  const today = daily[0]?.date;

  // --- Rainfall -----------------------------------------------------------
  daily.slice(0, 3).forEach((day, index) => {
    if (!isNum(day.precipitationSum)) return;
    if (day.precipitationSum >= thresholds.heavyRainMm) {
      const isVeryHeavy = day.precipitationSum >= thresholds.veryHeavyRainMm;
      alerts.push(
        makeAlert({
          category: 'rain',
          severity: isVeryHeavy ? 'severe' : 'warning',
          title: isVeryHeavy ? 'Very heavy rainfall expected' : 'Heavy rainfall expected',
          reason: `${round(day.precipitationSum, 1)} mm of rain is forecast for ${dayLabel(day.date, index).toLowerCase()}, which crosses the IMD heavy-rain threshold of ${thresholds.heavyRainMm} mm/day.`,
          advice: isVeryHeavy
            ? 'Avoid low-lying roads and underpasses, keep emergency contacts handy, and follow local flood advisories.'
            : 'Carry rain protection, allow extra travel time, and avoid waterlogged areas. Check local drainage and traffic updates.',
          value: round(day.precipitationSum, 1),
          unit: 'mm/day',
          threshold: thresholds.heavyRainMm,
          date: day.date,
          dayIndex: index,
          source: 'Open-Meteo forecast · IMD rainfall categories',
        })
      );
    }
  });

  // Intense hourly rain in the next 12 hours (watch level).
  const hourlyRows = weather?.hourly || [];
  const currentKey = String(current.time || '').slice(0, 13);
  let startIndex = hourlyRows.findIndex((row) => row.time.slice(0, 13) >= currentKey);
  if (startIndex < 0) startIndex = 0;
  const upcoming = hourlyRows.slice(startIndex, startIndex + 12);

  const maxHourly = upcoming.reduce(
    (best, row) => (isNum(row.precipitation) && (!best || row.precipitation > best.precipitation) ? row : best),
    null
  );

  if (maxHourly && maxHourly.precipitation >= thresholds.hourlyRainMm) {
    const alreadyCovered = alerts.some((a) => a.category === 'rain' && a.date === maxHourly.time.slice(0, 10));
    if (!alreadyCovered) {
      alerts.push(
        makeAlert({
          category: 'rain',
          severity: 'watch',
          title: 'Intense rain in the next 12 hours',
          reason: `Up to ${round(maxHourly.precipitation, 1)} mm of rain is forecast around ${maxHourly.time.slice(11, 16)}, above the ${thresholds.hourlyRainMm} mm/h watch level.`,
          advice: 'Plan outdoor travel around the heaviest hours and avoid parking in flood-prone spots.',
          value: round(maxHourly.precipitation, 1),
          unit: 'mm/h',
          threshold: thresholds.hourlyRainMm,
          date: maxHourly.time.slice(0, 10),
          dayIndex: maxHourly.time.slice(0, 10) === today ? 0 : 1,
          source: 'Open-Meteo hourly forecast',
        })
      );
    }
  }

  // --- Heat ---------------------------------------------------------------
  daily.slice(0, 3).forEach((day, index) => {
    if (!isNum(day.tempMax)) return;
    if (day.tempMax >= thresholds.heatwaveC) {
      const severe = day.tempMax >= thresholds.severeHeatC;
      alerts.push(
        makeAlert({
          category: 'heat',
          severity: severe ? 'severe' : 'warning',
          title: severe ? 'Extreme heat conditions' : 'Heatwave conditions likely',
          reason: `Maximum temperature is forecast to reach ${round(day.tempMax, 1)} °C, above the ${thresholds.heatwaveC} °C heatwave threshold for the plains.`,
          advice:
            'Drink water regularly, avoid outdoor work between 12 pm and 4 pm, never leave children or pets in parked vehicles, and check on older neighbours.',
          value: round(day.tempMax, 1),
          unit: '°C',
          threshold: thresholds.heatwaveC,
          date: day.date,
          dayIndex: index,
          source: 'Open-Meteo forecast · IMD heatwave criteria',
        })
      );
    }
  });

  // --- Wind ---------------------------------------------------------------
  daily.slice(0, 2).forEach((day, index) => {
    if (!isNum(day.windMax)) return;
    if (day.windMax >= thresholds.strongWindKmh) {
      alerts.push(
        makeAlert({
          category: 'wind',
          severity: day.windMax >= thresholds.strongWindKmh * 1.6 ? 'severe' : 'warning',
          title: 'Strong winds expected',
          reason: `Sustained wind speeds may reach ${round(day.windMax, 0)} km/h, above the ${thresholds.strongWindKmh} km/h advisory level.`,
          advice:
            'Secure loose outdoor objects, avoid standing under trees or weak structures, and take care while riding two-wheelers.',
          value: round(day.windMax, 0),
          unit: 'km/h',
          threshold: thresholds.strongWindKmh,
          date: day.date,
          dayIndex: index,
          source: 'Open-Meteo forecast',
        })
      );
    }
  });

  // --- Air quality --------------------------------------------------------
  if (aqi && isNum(aqi.value)) {
    if (aqi.value >= thresholds.aqiPoor) {
      const severe = aqi.value >= thresholds.aqiVeryPoor;
      alerts.push(
        makeAlert({
          category: 'air',
          severity: severe ? 'severe' : 'warning',
          title: severe ? 'Very poor air quality' : 'Poor air quality',
          reason: `Estimated CPCB AQI is ${aqi.value} (${aqi.category}), with ${aqi.dominantLabel} as the dominant pollutant. This is an estimate calculated from CAMS model concentrations.`,
          advice: severe
            ? 'Avoid outdoor exercise, keep windows closed during peak hours, and follow any local health advisories.'
            : 'Sensitive groups should reduce prolonged outdoor exertion. Consider a well-fitted mask if you must be outdoors for long.',
          value: aqi.value,
          unit: 'AQI',
          threshold: thresholds.aqiPoor,
          date: today,
          dayIndex: 0,
          source: 'WeatherGPT CPCB-style estimate · Open-Meteo CAMS',
        })
      );
    }
  }

  // --- UV ----------------------------------------------------------------
  const todayUv = daily[0]?.uvMax;
  if (isNum(todayUv) && todayUv >= thresholds.uvHigh) {
    alerts.push(
      makeAlert({
        category: 'uv',
        severity: 'watch',
        title: 'High UV exposure',
        reason: `The UV index is forecast to reach ${round(todayUv, 1)}, above the ${thresholds.uvHigh} "very high" level.`,
        advice: 'Use sunscreen, a hat and sunglasses, and avoid direct sun around midday.',
        value: round(todayUv, 1),
        unit: 'UV index',
        threshold: thresholds.uvHigh,
        date: today,
        dayIndex: 0,
        source: 'Open-Meteo forecast · WHO UV index scale',
      })
    );
  }

  // --- Thunderstorms -----------------------------------------------------
  daily.slice(0, 2).forEach((day, index) => {
    if ([95, 96, 99].includes(Number(day.weatherCode))) {
      const hail = [96, 99].includes(Number(day.weatherCode));
      alerts.push(
        makeAlert({
          category: 'storm',
          severity: hail ? 'warning' : 'watch',
          title: hail ? 'Thunderstorm with hail possible' : 'Thunderstorm possible',
          reason: `${day.condition.label} is forecast for ${dayLabel(day.date, index).toLowerCase()}.`,
          advice:
            'Move indoors when you hear thunder, avoid open ground and tall isolated trees, and unplug sensitive electronics if storms are severe.',
          value: day.condition.label,
          unit: null,
          threshold: null,
          date: day.date,
          dayIndex: index,
          source: 'Open-Meteo forecast (WMO weather codes)',
        })
      );
    }
  });

  return alerts.sort((a, b) => b.severityRank - a.severityRank || (a.date || '').localeCompare(b.date || ''));
}

export const ALERT_DISCLAIMER =
  'These are automatically computed advisories based on Open-Meteo forecasts and published IMD/CPCB thresholds. They are not official IMD, CPCB or government warnings. For authoritative alerts, check imd.gov.in and cpcb.nic.in.';

export { SEVERITY };
