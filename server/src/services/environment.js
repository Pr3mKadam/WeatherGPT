import { config } from '../config.js';
import { cached } from '../lib/cache.js';
import { fetchWeather, fetchAirQuality, sliceUpcomingHours } from './openMeteo.js';
import { buildAlerts, ALERT_DISCLAIMER } from './alerts.js';
import { computeRisk } from './risk.js';
import { buildAnalysis } from './analyzer.js';
import { fetchClimateProjection } from './climate.js';
import { AQI_STANDARD } from './aqi.js';
import { settingsStore } from '../db/index.js';

export async function getWeatherBundle(lat, lon) {
  return cached(`weather:${lat},${lon}`, config.cache.weather, async () => {
    const raw = await fetchWeather({ lat, lon, forecastDays: 7 });
    return {
      ...raw,
      hourly: sliceUpcomingHours(raw.hourly, raw.current.time, 48),
    };
  });
}

export async function getAirBundle(lat, lon, { pastDays = 2, forecastDays = 4 } = {}) {
  return cached(
    `air:${lat},${lon}:${pastDays}:${forecastDays}`,
    config.cache.air,
    () => fetchAirQuality({ lat, lon, pastDays, forecastDays })
  );
}

export async function getEnvironment({ lat, lon, name, admin1, country }) {
  const results = await Promise.allSettled([getWeatherBundle(lat, lon), getAirBundle(lat, lon)]);

  const weatherResult = results[0];
  if (weatherResult.status === 'rejected') throw weatherResult.reason;

  const weather = weatherResult.value;
  const air = results[1].status === 'fulfilled' ? results[1].value : null;

  const settings = await settingsStore.get();
  const location = {
    name: name || 'Selected location',
    admin1: admin1 || '',
    country: country || '',
    lat,
    lon,
    timezone: weather.timezone,
  };

  const alerts = buildAlerts({
    weather,
    air,
    thresholds: settings.thresholds,
    locationName: location.name,
  });

  const risk = computeRisk({ weather, air });
  const warnings = [];
  if (!air) {
    warnings.push(
      'Air-quality data is temporarily unavailable. Weather, alerts and risk exclude air quality right now.'
    );
  }
  if (weather.stale || air?.stale) {
    warnings.push('One or more upstream services were slow, so a slightly older cached response is being shown.');
  }

  return {
    location,
    weather,
    air,
    alerts,
    risk,
    meta: {
      fetchedAt: new Date().toISOString(),
      stale: Boolean(weather.stale || air?.stale),
      warnings,
      sources: [
        { name: 'Open-Meteo Weather API', url: 'https://open-meteo.com/', role: 'Current weather, hourly and 7-day forecast' },
        {
          name: 'Open-Meteo Air Quality API (CAMS)',
          url: 'https://open-meteo.com/en/docs/air-quality-api',
          role: 'Modelled pollutant concentrations',
        },
      ],
      standards: { aqi: AQI_STANDARD },
      alertsDisclaimer: ALERT_DISCLAIMER,
      notes: [
        'Weather values are model-based forecasts and can differ from conditions at your exact location.',
        'Air-quality values come from the CAMS model via Open-Meteo, not from CPCB monitoring stations.',
        'The AQI shown is a CPCB-style estimate calculated from pollutant concentrations — not an official CPCB value.',
        'Advisories are generated automatically and are not official IMD or CPCB warnings.',
      ],
    },
  };
}

export async function getWeatherOnly({ lat, lon, name, admin1, country }) {
  const weather = await getWeatherBundle(lat, lon);
  return {
    location: {
      name: name || 'Selected location',
      admin1: admin1 || '',
      country: country || '',
      lat,
      lon,
      timezone: weather.timezone,
    },
    weather,
    meta: {
      fetchedAt: new Date().toISOString(),
      stale: Boolean(weather.stale),
      sources: [{ name: 'Open-Meteo Weather API', url: 'https://open-meteo.com/', role: 'Weather forecast' }],
      notes: ['Weather values are model-based forecasts.'],
    },
  };
}

export async function getAirOnly({ lat, lon, name, admin1, country }) {
  const air = await getAirBundle(lat, lon);
  return {
    location: {
      name: name || 'Selected location',
      admin1: admin1 || '',
      country: country || '',
      lat,
      lon,
      timezone: air.timezone,
    },
    air,
    meta: {
      fetchedAt: new Date().toISOString(),
      stale: Boolean(air.stale),
      sources: [
        {
          name: 'Open-Meteo Air Quality API (CAMS)',
          url: 'https://open-meteo.com/en/docs/air-quality-api',
          role: 'Modelled pollutant concentrations',
        },
      ],
      standards: { aqi: AQI_STANDARD },
      notes: [
        'Pollutant concentrations are CAMS model values, not CPCB station measurements.',
        'AQI is estimated with CPCB breakpoints applied to hourly values.',
      ],
    },
  };
}

export async function getAnalysis({ lat, lon, name, admin1, country, days = 7 }) {
  return cached(`analysis:${lat},${lon}:${days}`, config.cache.analyzer, async () => {
    const [weather, air] = await Promise.all([
      fetchWeather({ lat, lon, pastDays: days, forecastDays: 1 }),
      fetchAirQuality({ lat, lon, pastDays: days, forecastDays: 1 }),
    ]);

    const analysis = buildAnalysis({ weather, air, days });

    return {
      location: {
        name: name || 'Selected location',
        admin1: admin1 || '',
        country: country || '',
        lat,
        lon,
        timezone: weather.timezone,
      },
      ...analysis,
      meta: {
        ...analysis.meta,
        fetchedAt: new Date().toISOString(),
        standards: { aqi: AQI_STANDARD },
        window: `Last ${days} days (hourly)`,
        sources: [
          { name: 'Open-Meteo Weather API', role: 'Hourly weather (past days)' },
          { name: 'Open-Meteo Air Quality API (CAMS)', role: 'Hourly pollutant concentrations (past days)' },
        ],
      },
    };
  });
}

export async function getClimate({ lat, lon, name, admin1, country }) {
  return cached(`climate:${lat},${lon}:${config.climateModel}`, config.cache.climate, async () => {
    const projection = await fetchClimateProjection({ lat, lon });
    return {
      location: {
        name: name || 'Selected location',
        admin1: admin1 || '',
        country: country || '',
        lat,
        lon,
      },
      ...projection,
      meta: {
        fetchedAt: new Date().toISOString(),
        disclaimer:
          'Climate projections describe long-term statistical change, not day-to-day weather. They are not a substitute for official national climate assessments.',
      },
    };
  });
}
