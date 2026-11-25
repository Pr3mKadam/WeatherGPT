import { config } from '../config.js';
import { cached } from '../lib/cache.js';
import { fetchJson, buildUrl } from '../lib/http.js';

/**
 * Real river-discharge data from Open-Meteo's Flood API, which serves the
 * Copernicus GloFAS global hydrological model. This is genuine monitored
 * hydrology (not a sample), but it is modelled at ~5 km resolution — it is
 * not a gauge reading, not a flood warning and not a water-quality measurement.
 */
const FLOOD_URL = 'https://flood-api.open-meteo.com/v1/flood';
const MODEL = 'GloFAS v4 (Copernicus Emergency Management Service)';

const round = (value, digits = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
};

const numbersOf = (values = []) => values.filter((value) => Number.isFinite(Number(value))).map(Number);

function average(values) {
  const nums = numbersOf(values);
  if (!nums.length) return null;
  return nums.reduce((sum, value) => sum + value, 0) / nums.length;
}

/** Where today's flow sits inside the retrieved window (relative, not absolute). */
function rankFlow(current, series) {
  if (!Number.isFinite(Number(current))) return { percentile: null, label: 'unavailable' };
  const sorted = numbersOf(series).sort((a, b) => a - b);
  if (!sorted.length) return { percentile: null, label: 'unavailable' };
  const below = sorted.filter((value) => value <= Number(current)).length;
  const percentile = Math.round((below / sorted.length) * 100);
  if (percentile <= 20) return { percentile, label: 'low flow' };
  if (percentile <= 60) return { percentile, label: 'typical flow' };
  if (percentile <= 85) return { percentile, label: 'above typical' };
  return { percentile, label: 'high flow' };
}

function trendOf(daily, pastDays) {
  const observed = daily.slice(0, pastDays).map((row) => row.discharge);
  if (observed.length < 6) return { direction: 'unknown', changePct: null };
  const recent = average(observed.slice(-3));
  const previous = average(observed.slice(-6, -3));
  if (recent === null || previous === null || previous === 0) {
    return { direction: 'steady', changePct: null };
  }
  const changePct = ((recent - previous) / previous) * 100;
  const direction = changePct > 5 ? 'rising' : changePct < -5 ? 'falling' : 'steady';
  return { direction, changePct: round(changePct, 1) };
}

export async function fetchRiverDischarge({
  lat,
  lon,
  name = 'Selected location',
  admin1 = '',
  country = '',
  pastDays = 7,
  forecastDays = 7,
}) {
  const key = `flood:${lat.toFixed(3)}:${lon.toFixed(3)}:${pastDays}:${forecastDays}`;

  // Cache the raw upstream payload so several pages can reuse it cheaply.
  const raw = await cached(key, config.cache.flood, async () => {
    const url = buildUrl(FLOOD_URL, {
      latitude: lat,
      longitude: lon,
      daily: 'river_discharge,river_discharge_mean,river_discharge_max',
      past_days: pastDays,
      forecast_days: forecastDays,
      timezone: 'auto',
    });
    return fetchJson(url, { service: 'Open-Meteo flood (GloFAS)' });
  });

  const dailyRaw = raw.daily || {};
  const times = dailyRaw.time || [];

  const daily = times.map((date, index) => ({
    date,
    discharge: round(dailyRaw.river_discharge?.[index], 2),
    mean: round(dailyRaw.river_discharge_mean?.[index], 2),
    max: round(dailyRaw.river_discharge_max?.[index], 2),
    // Rows before `pastDays` are modelled history; the rest are the forecast.
    kind: index < pastDays ? 'observed' : 'forecast',
  }));

  const observations = daily.slice(0, pastDays).filter((row) => row.discharge !== null);
  const today = daily[pastDays] || daily[pastDays - 1] || daily[daily.length - 1] || null;
  const allValues = daily.map((row) => row.discharge);
  const rank = rankFlow(today?.discharge, allValues);
  const trend = trendOf(daily, pastDays);
  const observedValues = observations.map((row) => row.discharge);

  return {
    location: {
      name,
      admin1,
      country,
      lat,
      lon,
      timezone: raw.timezone || null,
    },
    cell: {
      lat: round(raw.latitude, 3),
      lon: round(raw.longitude, 3),
      resolutionKm: 5,
      note: 'The GloFAS grid cell containing your coordinates. One cell can cover several kilometres of river.',
    },
    today: today
      ? {
          date: today.date,
          discharge: today.discharge,
          mean: today.mean,
          max: today.max,
          percentile: rank.percentile,
          label: rank.label,
          kind: today.kind,
        }
      : null,
    daily,
    summary: {
      observedDays: observations.length,
      forecastDays: Math.max(0, daily.length - pastDays),
      observedMin: observedValues.length ? round(Math.min(...observedValues), 2) : null,
      observedMax: observedValues.length ? round(Math.max(...observedValues), 2) : null,
      observedAverage: round(average(observedValues), 2),
      trend: trend.direction,
      trendChangePct: trend.changePct,
    },
    units: { discharge: 'm³/s' },
    source: {
      name: 'Open-Meteo Flood API',
      url: 'https://open-meteo.com/en/docs/flood-api',
      model: MODEL,
    },
    method:
      'Daily river discharge for the GloFAS grid cell containing the selected coordinates. History is model reanalysis; the forward days are a hydrological forecast.',
    notes: [
      'River discharge is the volume of water passing a point each second, in cubic metres per second (m³/s).',
      'The low/typical/high label compares today with the other days in this 14-day window only. It is not an official flood classification.',
      'This project does not measure water quality. The parameters further down the page are clearly labelled teaching samples.',
    ],
    disclaimer:
      'Modelled GloFAS river discharge, not a gauge reading and not a flood warning. For flood decisions use the Central Water Commission, IMD and local authority advisories.',
    fetchedAt: new Date().toISOString(),
  };
}
