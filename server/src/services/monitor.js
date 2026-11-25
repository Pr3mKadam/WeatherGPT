import { promises as fs } from 'node:fs';
import { config } from '../config.js';
import { fetchWeather, fetchAirQuality } from './openMeteo.js';

/**
 * Real monitoring loop.
 *
 * The sampler reads the *live* Open-Meteo weather + CAMS air-quality values,
 * stores one point per interval in server/data/monitor.json, and keeps a
 * rolling window. The UI combines those recorded points with the last 24 hours
 * of upstream hourly data so a new install still shows a real series while the
 * sampler builds its own history.
 *
 * Nothing here is invented: every value comes from the upstream API or from a
 * sample this server actually recorded.
 */
const MIN_GAP_MS = Math.max(
  30_000,
  Math.round(config.monitoring.intervalMinutes * 60_000 * 0.5)
);
const RETENTION_MS = config.monitoring.retentionDays * 24 * 60 * 60 * 1000;

let writeQueue = Promise.resolve();
let timer = null;

const stats = {
  locations: 0,
  samples: 0,
  lastSampleAt: null,
};

function emptyStore() {
  return { locations: {} };
}

async function readData() {
  let data;
  try {
    const raw = await fs.readFile(config.monitorFile, 'utf8');
    const parsed = JSON.parse(raw);
    data = {
      locations:
        parsed && typeof parsed.locations === 'object' && parsed.locations
          ? parsed.locations
          : {},
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      data = emptyStore();
    } else if (error instanceof SyntaxError) {
      console.warn('[monitor] monitor.json was not valid JSON; starting a fresh series.');
      data = emptyStore();
    } else {
      throw error;
    }
  }

  const entries = Object.values(data.locations);
  stats.locations = entries.length;
  stats.samples = entries.reduce(
    (sum, entry) => sum + (Array.isArray(entry?.points) ? entry.points.length : 0),
    0
  );
  stats.lastSampleAt = entries.reduce((latest, entry) => {
    const at = entry?.lastSampleAt;
    if (!at) return latest;
    if (!latest) return at;
    return at > latest ? at : latest;
  }, null);

  return data;
}

async function writeData(data) {
  await fs.mkdir(config.dataDir, { recursive: true });
  const temp = `${config.monitorFile}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(temp, config.monitorFile);
}

function mutate(producer) {
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    const data = await readData();
    const result = await producer(data);
    await writeData(data);
    return result;
  });
  return writeQueue;
}

export function locationKey(location) {
  return `${Number(location.lat).toFixed(2)},${Number(location.lon).toFixed(2)}`;
}

function locationMeta(location) {
  return {
    name: location.name || 'Selected location',
    admin1: location.admin1 || '',
    country: location.country || '',
    lat: Number(location.lat),
    lon: Number(location.lon),
  };
}

const hourKey = (value) => String(value || '').slice(0, 13);

async function buildBaseline(location, hours) {
  const [weatherResult, airResult] = await Promise.allSettled([
    fetchWeather({ lat: location.lat, lon: location.lon, pastDays: 1, forecastDays: 1 }),
    fetchAirQuality({ lat: location.lat, lon: location.lon, pastDays: 1, forecastDays: 1 }),
  ]);

  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const air = airResult.status === 'fulfilled' ? airResult.value : null;

  if (weatherResult.status === 'rejected') {
    console.warn('[monitor] baseline weather unavailable:', weatherResult.reason?.message);
  }
  if (airResult.status === 'rejected') {
    console.warn('[monitor] baseline air quality unavailable:', airResult.reason?.message);
  }

  if (!weather?.hourly?.length) {
    return { rows: [], used: false, airUsed: Boolean(air) };
  }

  const nowKey = hourKey(weather.current?.time);
  const airByHour = new Map((air?.hourly || []).map((row) => [hourKey(row.time), row]));

  const rows = weather.hourly
    .filter((row) => !nowKey || hourKey(row.time) <= nowKey)
    .slice(-hours)
    .map((row) => {
      const airRow = airByHour.get(hourKey(row.time));
      return {
        t: row.time,
        temp: row.temperature,
        humidity: row.humidity,
        wind: row.windSpeed,
        precip: row.precipitation,
        aqi: airRow?.aqi ?? null,
        category: airRow?.category ?? null,
        pm25: airRow?.pm25 ?? null,
        pm10: airRow?.pm10 ?? null,
        source: 'upstream',
      };
    });

  return { rows, used: rows.length > 0, airUsed: Boolean(air) };
}

function mergeSeries(baselineRows, recordedPoints, hours) {
  const byHour = new Map();

  for (const row of baselineRows) {
    byHour.set(hourKey(row.t), row);
  }

  for (const point of recordedPoints) {
    const key = hourKey(point.t);
    // A point this server actually recorded is preferred over upstream history.
    byHour.set(key, {
      t: point.t,
      temp: point.temp ?? null,
      humidity: point.humidity ?? null,
      wind: point.wind ?? null,
      precip: point.precip ?? null,
      aqi: point.aqi ?? null,
      category: point.category ?? null,
      pm25: point.pm25 ?? null,
      pm10: point.pm10 ?? null,
      recordedAt: point.recordedAt || null,
      source: 'recorded',
    });
  }

  return [...byHour.values()]
    .sort((a, b) => String(a.t).localeCompare(String(b.t)))
    .slice(-hours);
}

function summarise(series) {
  const temps = series.map((row) => row.temp).filter(Number.isFinite);
  const aqis = series.map((row) => row.aqi).filter(Number.isFinite);
  const pm25s = series.map((row) => row.pm25).filter(Number.isFinite);
  const avg = (values) =>
    values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

  return {
    points: series.length,
    recordedPoints: series.filter((row) => row.source === 'recorded').length,
    tempMin: temps.length ? Math.round(Math.min(...temps) * 10) / 10 : null,
    tempMax: temps.length ? Math.round(Math.max(...temps) * 10) / 10 : null,
    tempAverage: avg(temps),
    aqiMin: aqis.length ? Math.round(Math.min(...aqis)) : null,
    aqiMax: aqis.length ? Math.round(Math.max(...aqis)) : null,
    aqiAverage: aqis.length ? Math.round(avg(aqis)) : null,
    pm25Average: avg(pm25s),
  };
}

/**
 * Fetch live conditions and append a point if the interval has elapsed.
 * Upstream failures are logged and swallowed so the history endpoint keeps
 * serving whatever has already been recorded.
 */
export async function sampleLocation(location, { force = false } = {}) {
  if (!config.monitoring.enabled && !force) {
    return { entry: null, sampled: false, skipped: 'disabled' };
  }
  if (!Number.isFinite(Number(location?.lat)) || !Number.isFinite(Number(location?.lon))) {
    return { entry: null, sampled: false, skipped: 'invalid_location' };
  }

  const key = locationKey(location);
  const snapshot = await readData();
  const existing = snapshot.locations[key];
  const lastPoint = existing?.points?.[existing.points.length - 1];

  if (!force && lastPoint) {
    const lastAt = new Date(lastPoint.recordedAt || 0).getTime();
    if (Number.isFinite(lastAt) && Date.now() - lastAt < MIN_GAP_MS) {
      return { entry: existing, sampled: false, skipped: 'not_due' };
    }
  }

  const [weatherResult, airResult] = await Promise.allSettled([
    fetchWeather({ lat: location.lat, lon: location.lon, pastDays: 0, forecastDays: 1 }),
    fetchAirQuality({ lat: location.lat, lon: location.lon, pastDays: 0, forecastDays: 1 }),
  ]);

  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const air = airResult.status === 'fulfilled' ? airResult.value : null;

  if (!weather && !air) {
    console.warn('[monitor] sample skipped: both upstream services failed');
    return { entry: existing || null, sampled: false, skipped: 'upstream_failed' };
  }

  const point = {
    t: weather?.current?.time || new Date().toISOString(),
    recordedAt: new Date().toISOString(),
    temp: weather?.current?.temperature ?? null,
    humidity: weather?.current?.humidity ?? null,
    wind: weather?.current?.windSpeed ?? null,
    precip: weather?.current?.precipitation ?? null,
    condition: weather?.current?.condition?.label ?? null,
    aqi: air?.aqi?.value ?? null,
    category: air?.aqi?.category ?? null,
    pm25: air?.current?.pm25 ?? null,
    pm10: air?.current?.pm10 ?? null,
  };

  const entry = await mutate((data) => {
    const current = data.locations[key] || {
      key,
      ...locationMeta(location),
      points: [],
      createdAt: point.recordedAt,
    };

    const duplicate = current.points.find((item) => hourKey(item.t) === hourKey(point.t));
    if (duplicate) {
      Object.assign(duplicate, point);
    } else {
      current.points.push(point);
    }

    const cutoff = Date.now() - RETENTION_MS;
    current.points = current.points
      .filter((item) => new Date(item.recordedAt || 0).getTime() >= cutoff)
      .slice(-config.monitoring.maxPoints);

    current.name = location.name || current.name;
    current.admin1 = location.admin1 ?? current.admin1;
    current.country = location.country ?? current.country;
    current.lat = Number(location.lat);
    current.lon = Number(location.lon);
    current.lastSampleAt = point.recordedAt;

    data.locations[key] = current;
    return current;
  });

  return { entry, sampled: true, skipped: null };
}

/** Recorded history + real upstream hourly baseline for the requested window. */
export async function getHistory(location, { hours = 24 } = {}) {
  const safeHours = Math.min(168, Math.max(1, Math.round(Number(hours) || 24)));

  const sample = await sampleLocation(location).catch((error) => {
    console.warn('[monitor] sample attempt failed:', error.message);
    return { entry: null, sampled: false, skipped: 'error' };
  });

  const snapshot = await readData();
  const entry = snapshot.locations[locationKey(location)] || sample.entry || null;
  const baseline = await buildBaseline(location, safeHours);
  const series = mergeSeries(baseline.rows, entry?.points || [], safeHours);
  const lastPoint = entry?.points?.[entry.points.length - 1] || null;
  const nextDueAt = lastPoint
    ? new Date(new Date(lastPoint.recordedAt || 0).getTime() + MIN_GAP_MS).toISOString()
    : null;

  return {
    location: locationMeta(location),
    windowHours: safeHours,
    series,
    summary: summarise(series),
    recorded: {
      total: entry?.points?.length || 0,
      inWindow: series.filter((row) => row.source === 'recorded').length,
      firstAt: entry?.points?.[0]?.recordedAt || null,
      lastAt: lastPoint?.recordedAt || null,
      lastAqi: lastPoint?.aqi ?? null,
      nextDueAt,
    },
    baseline: {
      used: baseline.used,
      rows: baseline.rows.length,
      airUsed: baseline.airUsed,
      source: 'Open-Meteo hourly weather + CAMS air quality (past 24 h)',
      note: baseline.used
        ? 'Upstream hourly values fill the window until this server has recorded its own samples.'
        : 'Upstream hourly history was unavailable, so only recorded samples are shown.',
    },
    sampler: {
      enabled: config.monitoring.enabled,
      intervalMinutes: config.monitoring.intervalMinutes,
      minGapSeconds: Math.round(MIN_GAP_MS / 1000),
      retentionDays: config.monitoring.retentionDays,
    },
    method:
      'Every point is real: either an hourly value returned by Open-Meteo/CAMS, or a sample this server recorded on its interval. Recorded samples overwrite the upstream value for the same hour.',
    disclaimer:
      'Recorded by this project for awareness. Air-quality inputs are CAMS model estimates and the AQI is a CPCB-style estimate, not a station measurement.',
    fetchedAt: new Date().toISOString(),
  };
}

export function monitorStatus() {
  return {
    enabled: config.monitoring.enabled,
    intervalMinutes: config.monitoring.intervalMinutes,
    retentionDays: config.monitoring.retentionDays,
    storage: 'server/data/monitor.json',
    trackedLocations: stats.locations,
    totalSamples: stats.samples,
    lastSampleAt: stats.lastSampleAt,
    note: config.monitoring.enabled
      ? `Sampling live weather and air quality every ${config.monitoring.intervalMinutes} minutes.`
      : 'The background sampler is disabled (MONITOR_ENABLED=false).',
  };
}

/** Start the interval sampler. Safe to call once; `getDefaultLocation` supplies a fallback target. */
export function startMonitoring(getDefaultLocation) {
  if (!config.monitoring.enabled) {
    console.log('[monitor] disabled via MONITOR_ENABLED=false');
    return;
  }
  if (timer) return;

  const tick = async () => {
    try {
      const location = await getDefaultLocation();
      if (!location?.lat) return;
      const result = await sampleLocation(location);
      if (result.sampled) {
        console.log(`[monitor] recorded a sample for ${location.name || 'the default location'}`);
      }
    } catch (error) {
      console.warn('[monitor] background sample failed:', error.message);
    }
  };

  tick();
  timer = setInterval(tick, config.monitoring.intervalMinutes * 60_000);
  if (typeof timer.unref === 'function') timer.unref();
  console.log(`[monitor] background sampler every ${config.monitoring.intervalMinutes} min`);
}

export function stopMonitoring() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
