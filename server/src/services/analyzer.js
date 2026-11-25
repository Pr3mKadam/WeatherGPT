import { isNum, mean, pearson, round } from '../lib/utils.js';

function shiftKey(key, hours) {
  const date = new Date(`${key}:00:00Z`);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString().slice(0, 13);
}

function strengthOf(r) {
  const abs = Math.abs(r);
  if (abs >= 0.7) return 'Strong';
  if (abs >= 0.4) return 'Moderate';
  if (abs >= 0.2) return 'Weak';
  return 'Negligible';
}

function correlate(series, xKey, yKey) {
  const pairs = series
    .map((row) => [row[xKey], row[yKey]])
    .filter(([x, y]) => isNum(x) && isNum(y));
  const r = pearson(
    pairs.map(([x]) => x),
    pairs.map(([, y]) => y)
  );
  return { r: r === null ? null : round(r, 2), n: pairs.length };
}

const NOTES = {
  'wind-pm25': {
    negative:
      'Higher wind speeds line up with lower PM2.5 — wind ventilates the boundary layer and disperses fine particles.',
    positive:
      'PM2.5 rose with wind speed in this window, which can happen when dust is resuspended or pollution is transported from elsewhere.',
  },
  'humidity-pm25': {
    positive:
      'Higher humidity coincided with higher PM2.5. Humid, stagnant air can trap particles and encourage them to grow.',
    negative:
      'Drier hours had higher PM2.5 in this window, so humidity was not the limiting factor here.',
  },
  'temperature-pm25': {
    positive:
      'Warmer hours were associated with higher PM2.5, often a sign of shallow mixing or local source activity.',
    negative:
      'Warmer, better-mixed hours had lower PM2.5 in this window.',
  },
  'precipitation-pm10': {
    negative:
      'Rainfall coincides with lower PM10, consistent with wet deposition washing coarse dust out of the air.',
    positive:
      'PM10 did not fall with rainfall here — dust resuspension or transport may have outweighed washout.',
  },
  'temperature-o3': {
    positive:
      'Warmer hours had higher ozone. Sunlight and heat drive photochemical ozone formation.',
    negative:
      'Ozone did not rise with temperature in this window; cloud cover or NOx titration may have limited formation.',
  },
  'wind-pm10': {
    negative:
      'Stronger winds are associated with lower PM10, pointing to dispersion of coarse dust.',
    positive:
      'Higher winds coincided with more PM10, a pattern often caused by dust resuspension from dry surfaces.',
  },
};

function buildCorrelation(series, xKey, xLabel, yKey, yLabel) {
  const { r, n } = correlate(series, xKey, yKey);
  if (r === null) {
    return {
      id: `${xKey}-${yKey}`,
      xKey,
      xLabel,
      yKey,
      yLabel,
      r: null,
      n,
      strength: 'Unavailable',
      direction: null,
      note: 'Not enough overlapping data in this window to calculate a correlation.',
    };
  }
  const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : 'none';
  const noteSet = NOTES[`${xKey}-${yKey}`];
  return {
    id: `${xKey}-${yKey}`,
    xKey,
    xLabel,
    yKey,
    yLabel,
    r,
    n,
    strength: strengthOf(r),
    direction,
    note:
      (noteSet && noteSet[direction]) ||
      `${xLabel} and ${yLabel} moved together ${direction === 'negative' ? 'in opposite directions' : 'in the same direction'} during this window.`,
  };
}

/**
 * Weather–pollution relationship analysis over a past window.
 * Correlations are descriptive, not causal.
 */
export function buildAnalysis({ weather, air, days = 7 }) {
  const nowKey = String(weather?.current?.time || '').slice(0, 13);
  const cutoffKey = shiftKey(nowKey, -days * 24);

  const airMap = new Map((air?.hourly || []).map((row) => [row.time.slice(0, 13), row]));
  const series = [];

  for (const row of weather?.hourly || []) {
    const key = row.time.slice(0, 13);
    if (key < cutoffKey || key > nowKey) continue;
    const airRow = airMap.get(key);
    if (!airRow) continue;
    series.push({
      time: row.time,
      temperature: row.temperature,
      humidity: row.humidity,
      windSpeed: row.windSpeed,
      precipitation: row.precipitation,
      pm25: airRow.pm25,
      pm10: airRow.pm10,
      o3: airRow.o3,
      no2: airRow.no2,
      aqi: airRow.aqi,
    });
  }

  const correlations = [
    buildCorrelation(series, 'windSpeed', 'Wind speed', 'pm25', 'PM2.5'),
    buildCorrelation(series, 'humidity', 'Humidity', 'pm25', 'PM2.5'),
    buildCorrelation(series, 'temperature', 'Temperature', 'pm25', 'PM2.5'),
    buildCorrelation(series, 'precipitation', 'Rainfall', 'pm10', 'PM10'),
    buildCorrelation(series, 'temperature', 'Temperature', 'o3', 'Ozone'),
    buildCorrelation(series, 'windSpeed', 'Wind speed', 'pm10', 'PM10'),
  ];

  const pm25 = series.map((row) => row.pm25);
  const pm10 = series.map((row) => row.pm10);
  const aqi = series.map((row) => row.aqi);
  const exceedanceHours = series.filter((row) => isNum(row.pm25) && row.pm25 > 60).length;
  const calmHumidHours = series.filter(
    (row) => isNum(row.windSpeed) && isNum(row.humidity) && row.windSpeed < 8 && row.humidity > 70
  ).length;
  const rainyHours = series.filter((row) => isNum(row.precipitation) && row.precipitation > 0.1).length;
  const windyHours = series.filter((row) => isNum(row.windSpeed) && row.windSpeed >= 20).length;

  const totalHours = series.length;
  const pct = (value) => (totalHours ? Math.round((value / totalHours) * 100) : 0);

  const dailyMap = new Map();
  for (const row of series) {
    const date = row.time.slice(0, 10);
    if (!dailyMap.has(date)) dailyMap.set(date, { date, pm25: [], pm10: [], wind: [], temp: [], rain: [] });
    const bucket = dailyMap.get(date);
    if (isNum(row.pm25)) bucket.pm25.push(row.pm25);
    if (isNum(row.pm10)) bucket.pm10.push(row.pm10);
    if (isNum(row.windSpeed)) bucket.wind.push(row.windSpeed);
    if (isNum(row.temperature)) bucket.temp.push(row.temperature);
    if (isNum(row.precipitation)) bucket.rain.push(row.precipitation);
  }

  const daily = [...dailyMap.values()].map((bucket) => ({
    date: bucket.date,
    pm25: round(mean(bucket.pm25), 1),
    pm10: round(mean(bucket.pm10), 1),
    wind: round(mean(bucket.wind), 1),
    temperature: round(mean(bucket.temp), 1),
    rain: round(bucket.rain.reduce((a, b) => a + b, 0), 1),
  }));

  const trapRows = series.filter(
    (row) => isNum(row.windSpeed) && isNum(row.humidity) && row.windSpeed < 8 && row.humidity > 70
  );

  const pm25Mean = mean(pm25);
  let dominantPattern = 'Not enough data to describe a clear pattern for this window.';
  if (totalHours >= 12) {
    if (pct(calmHumidHours) >= 30) {
      dominantPattern = `Stagnant, humid conditions occurred in ${pct(calmHumidHours)}% of hours. These are the hours when pollutants are most likely to accumulate near the ground.`;
    } else if (pct(windyHours) >= 30) {
      dominantPattern = `Ventilated conditions (wind ≥ 20 km/h) occurred in ${pct(windyHours)}% of hours, which generally helps disperse pollutants.`;
    } else if (rainyHours > 0) {
      dominantPattern = `Rainfall occurred in ${rainyHours} hour(s), which can wash particles out of the air — but the effect depends on intensity and duration.`;
    } else {
      dominantPattern =
        'Conditions were mixed: no single weather pattern dominated the pollution record in this window.';
    }
  }

  return {
    windowDays: days,
    totalHours,
    series: series.map((row) => ({
      time: row.time,
      temperature: row.temperature,
      humidity: row.humidity,
      windSpeed: row.windSpeed,
      precipitation: row.precipitation,
      pm25: row.pm25,
      pm10: row.pm10,
      o3: row.o3,
      no2: row.no2,
      aqi: row.aqi,
    })),
    correlations,
    scatter: {
      windVsPm25: series
        .filter((row) => isNum(row.windSpeed) && isNum(row.pm25))
        .map((row) => ({ x: row.windSpeed, y: row.pm25 })),
      temperatureVsPm25: series
        .filter((row) => isNum(row.temperature) && isNum(row.pm25))
        .map((row) => ({ x: row.temperature, y: row.pm25 })),
      humidityVsPm25: series
        .filter((row) => isNum(row.humidity) && isNum(row.pm25))
        .map((row) => ({ x: row.humidity, y: row.pm25 })),
    },
    summary: {
      pm25Mean: round(pm25Mean, 1),
      pm25Max: round(Math.max(...pm25.filter(isNum)), 1),
      pm10Mean: round(mean(pm10), 1),
      pm10Max: round(Math.max(...pm10.filter(isNum)), 1),
      aqiMean: round(mean(aqi), 0),
      aqiMax: round(Math.max(...aqi.filter(isNum)), 0),
      exceedanceHours,
      exceedancePct: pct(exceedanceHours),
      calmHumidHours,
      calmHumidPct: pct(calmHumidHours),
      rainyHours,
      windyHours,
      dominantPattern,
    },
    trapWindows: {
      count: trapRows.length,
      hours: trapRows.slice(-6).map((row) => ({
        time: row.time,
        windSpeed: row.windSpeed,
        humidity: row.humidity,
        pm25: row.pm25,
      })),
      definition:
        'Hours with wind below 8 km/h and humidity above 70% — conditions that often favour pollutant build-up. This is a screening indicator, not a measurement of atmospheric stability.',
    },
    daily,
    meta: {
      note:
        'Correlation shows how two variables moved together; it does not prove that one caused the other. Air-quality values are CAMS model estimates, not CPCB station measurements.',
      sources: [
        { name: 'Open-Meteo Weather API', role: 'Hourly weather' },
        { name: 'Open-Meteo Air Quality API (CAMS)', role: 'Hourly pollutant concentrations' },
      ],
    },
  };
}
