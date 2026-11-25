import { fetchJson, buildUrl } from '../lib/http.js';
import { numOrNull, round } from '../lib/utils.js';
import { compassLabel, describeWeather } from './weatherCodes.js';
import { computeAqi, summariseAirByDay, AQI_STANDARD } from './aqi.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'rain',
  'showers',
  'snowfall',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
];

const HOURLY_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'uv_index',
  'is_day',
  'cloud_cover',
];

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'precipitation_sum',
  'rain_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'wind_direction_10m_dominant',
  'uv_index_max',
  'sunrise',
  'sunset',
  'daylight_duration',
];

export async function geocodeSearch(query) {
  const url = buildUrl(GEO_URL, {
    name: query,
    count: 8,
    language: 'en',
    format: 'json',
  });
  const data = await fetchJson(url, { service: 'Open-Meteo geocoding' });
  return (data.results || []).map((item) => ({
    id: item.id,
    name: item.name,
    admin1: item.admin1 || '',
    country: item.country || '',
    countryCode: item.country_code || '',
    lat: round(item.latitude, 4),
    lon: round(item.longitude, 4),
    timezone: item.timezone || null,
    population: item.population || null,
    label: [item.name, item.admin1, item.country].filter(Boolean).join(', '),
  }));
}

/**
 * Reverse geocoding is only used to give a friendly name to browser coordinates.
 * Open-Meteo's geocoder does not support reverse lookups, so we use BigDataCloud's
 * keyless endpoint and degrade gracefully to "My location" if it is unavailable.
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = buildUrl(REVERSE_URL, { latitude: lat, longitude: lon, localityLanguage: 'en' });
    const data = await fetchJson(url, { timeoutMs: 8000, service: 'reverse geocoding' });
    const name = data.city || data.locality || data.principalSubdivision || 'My location';
    return {
      name,
      admin1: data.principalSubdivision || '',
      country: data.countryName || '',
      countryCode: data.countryCode || '',
      lat,
      lon,
      timezone: null,
    };
  } catch (error) {
    console.warn(`[geo] reverse geocoding failed: ${error.message}`);
    return {
      name: 'My location',
      admin1: '',
      country: '',
      countryCode: '',
      lat,
      lon,
      timezone: null,
    };
  }
}

export async function fetchWeather({ lat, lon, pastDays = 0, forecastDays = 7 }) {
  const url = buildUrl(FORECAST_URL, {
    latitude: lat,
    longitude: lon,
    current: CURRENT_FIELDS.join(','),
    hourly: HOURLY_FIELDS.join(','),
    daily: DAILY_FIELDS.join(','),
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    past_days: pastDays || undefined,
    forecast_days: forecastDays,
  });

  const data = await fetchJson(url, { service: 'Open-Meteo weather' });
  return normaliseWeather(data);
}

function normaliseWeather(data) {
  const currentRaw = data.current || {};
  const hourlyRaw = data.hourly || {};
  const dailyRaw = data.daily || {};
  const timezone = data.timezone || 'UTC';

  const hourly = (hourlyRaw.time || []).map((time, index) => {
    const isDay = hourlyRaw.is_day?.[index] === 1;
    return {
      time,
      temperature: round(numOrNull(hourlyRaw.temperature_2m?.[index]), 1),
      apparentTemperature: round(numOrNull(hourlyRaw.apparent_temperature?.[index]), 1),
      humidity: round(numOrNull(hourlyRaw.relative_humidity_2m?.[index]), 0),
      precipitationProbability: round(numOrNull(hourlyRaw.precipitation_probability?.[index]), 0),
      precipitation: round(numOrNull(hourlyRaw.precipitation?.[index]), 2),
      weatherCode: numOrNull(hourlyRaw.weather_code?.[index]),
      condition: describeWeather(hourlyRaw.weather_code?.[index], isDay),
      windSpeed: round(numOrNull(hourlyRaw.wind_speed_10m?.[index]), 1),
      windDirection: round(numOrNull(hourlyRaw.wind_direction_10m?.[index]), 0),
      uvIndex: round(numOrNull(hourlyRaw.uv_index?.[index]), 1),
      cloudCover: round(numOrNull(hourlyRaw.cloud_cover?.[index]), 0),
      isDay,
    };
  });

  const daily = (dailyRaw.time || []).map((date, index) => {
    const code = dailyRaw.weather_code?.[index];
    return {
      date,
      weatherCode: numOrNull(code),
      condition: describeWeather(code, true),
      tempMax: round(numOrNull(dailyRaw.temperature_2m_max?.[index]), 1),
      tempMin: round(numOrNull(dailyRaw.temperature_2m_min?.[index]), 1),
      apparentMax: round(numOrNull(dailyRaw.apparent_temperature_max?.[index]), 1),
      precipitationSum: round(numOrNull(dailyRaw.precipitation_sum?.[index]), 1),
      rainSum: round(numOrNull(dailyRaw.rain_sum?.[index]), 1),
      precipitationProbabilityMax: round(
        numOrNull(dailyRaw.precipitation_probability_max?.[index]),
        0
      ),
      windMax: round(numOrNull(dailyRaw.wind_speed_10m_max?.[index]), 1),
      windGustMax: round(numOrNull(dailyRaw.wind_gusts_10m_max?.[index]), 1),
      windDirection: round(numOrNull(dailyRaw.wind_direction_10m_dominant?.[index]), 0),
      uvMax: round(numOrNull(dailyRaw.uv_index_max?.[index]), 1),
      sunrise: dailyRaw.sunrise?.[index] || null,
      sunset: dailyRaw.sunset?.[index] || null,
      daylightSeconds: numOrNull(dailyRaw.daylight_duration?.[index]),
    };
  });

  // Current UV and cloud cover are taken from the matching hourly row because
  // Open-Meteo does not expose uv_index in the "current" block.
  const currentKey = String(currentRaw.time || '').slice(0, 13);
  const currentHour = hourly.find((row) => row.time.slice(0, 13) === currentKey) || hourly[0];

  const isDay = currentRaw.is_day === 1;
  const current = {
    time: currentRaw.time || null,
    temperature: round(numOrNull(currentRaw.temperature_2m), 1),
    apparentTemperature: round(numOrNull(currentRaw.apparent_temperature), 1),
    humidity: round(numOrNull(currentRaw.relative_humidity_2m), 0),
    precipitation: round(numOrNull(currentRaw.precipitation), 2),
    rain: round(numOrNull(currentRaw.rain), 2),
    showers: round(numOrNull(currentRaw.showers), 2),
    snowfall: round(numOrNull(currentRaw.snowfall), 2),
    weatherCode: numOrNull(currentRaw.weather_code),
    condition: describeWeather(currentRaw.weather_code, isDay),
    cloudCover: round(numOrNull(currentRaw.cloud_cover), 0),
    pressure: round(numOrNull(currentRaw.pressure_msl), 0),
    surfacePressure: round(numOrNull(currentRaw.surface_pressure), 0),
    windSpeed: round(numOrNull(currentRaw.wind_speed_10m), 1),
    windDirection: round(numOrNull(currentRaw.wind_direction_10m), 0),
    windDirectionLabel: compassLabel(currentRaw.wind_direction_10m),
    windGust: round(numOrNull(currentRaw.wind_gusts_10m), 1),
    uvIndex: currentHour?.uvIndex ?? null,
    isDay,
  };

  return {
    timezone,
    timezoneAbbreviation: data.timezone_abbreviation || null,
    utcOffsetSeconds: data.utc_offset_seconds ?? null,
    current,
    hourly,
    daily,
    units: {
      temperature: '°C',
      precipitation: 'mm',
      windSpeed: 'km/h',
      humidity: '%',
      pressure: 'hPa',
      uv: 'index',
    },
    source: {
      name: 'Open-Meteo',
      url: 'https://open-meteo.com/',
      model: data.model || 'best_match',
    },
  };
}

/** Return only the hours from (and including) the current hour, up to `count`. */
export function sliceUpcomingHours(hourly, currentTime, count = 48) {
  if (!Array.isArray(hourly) || !hourly.length) return [];
  const key = String(currentTime || '').slice(0, 13);
  let start = hourly.findIndex((row) => row.time.slice(0, 13) >= key);
  if (start < 0) start = 0;
  return hourly.slice(start, start + count);
}

export async function fetchAirQuality({ lat, lon, pastDays = 0, forecastDays = 5 }) {
  const url = buildUrl(AIR_URL, {
    latitude: lat,
    longitude: lon,
    current: [
      'pm2_5',
      'pm10',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'dust',
      'aerosol_optical_depth',
      'uv_index',
    ].join(','),
    hourly: [
      'pm2_5',
      'pm10',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'us_aqi',
    ].join(','),
    timezone: 'auto',
    past_days: pastDays || undefined,
    forecast_days: forecastDays,
  });

  const data = await fetchJson(url, { service: 'Open-Meteo air quality' });
  return normaliseAir(data);
}

function normaliseAir(data) {
  const currentRaw = data.current || {};
  const hourlyRaw = data.hourly || {};

  const currentPollutants = {
    pm25: numOrNull(currentRaw.pm2_5),
    pm10: numOrNull(currentRaw.pm10),
    co: numOrNull(currentRaw.carbon_monoxide),
    no2: numOrNull(currentRaw.nitrogen_dioxide),
    so2: numOrNull(currentRaw.sulphur_dioxide),
    o3: numOrNull(currentRaw.ozone),
  };

  const hourly = (hourlyRaw.time || []).map((time, index) => {
    const pollutants = {
      pm25: numOrNull(hourlyRaw.pm2_5?.[index]),
      pm10: numOrNull(hourlyRaw.pm10?.[index]),
      co: numOrNull(hourlyRaw.carbon_monoxide?.[index]),
      no2: numOrNull(hourlyRaw.nitrogen_dioxide?.[index]),
      so2: numOrNull(hourlyRaw.sulphur_dioxide?.[index]),
      o3: numOrNull(hourlyRaw.ozone?.[index]),
    };
    const aqi = computeAqi(pollutants);
    return {
      time,
      pm25: round(pollutants.pm25, 1),
      pm10: round(pollutants.pm10, 1),
      co: round(pollutants.co, 0),
      no2: round(pollutants.no2, 1),
      so2: round(pollutants.so2, 1),
      o3: round(pollutants.o3, 1),
      aqi: aqi?.value ?? null,
      category: aqi?.category ?? null,
      categoryKey: aqi?.categoryKey ?? null,
      dominant: aqi?.dominant ?? null,
    };
  });

  const aqi = computeAqi(currentPollutants);
  const daily = summariseAirByDay(hourly);

  return {
    timezone: data.timezone || 'UTC',
    current: {
      time: currentRaw.time || null,
      pm25: round(currentPollutants.pm25, 1),
      pm10: round(currentPollutants.pm10, 1),
      co: round(currentPollutants.co, 0),
      coMg: currentPollutants.co !== null ? round(currentPollutants.co / 1000, 2) : null,
      no2: round(currentPollutants.no2, 1),
      so2: round(currentPollutants.so2, 1),
      o3: round(currentPollutants.o3, 1),
      dust: round(numOrNull(currentRaw.dust), 1),
      aerosolOpticalDepth: round(numOrNull(currentRaw.aerosol_optical_depth), 2),
      uvIndex: round(numOrNull(currentRaw.uv_index), 1),
      aqi: aqi?.value ?? null,
      category: aqi?.category ?? null,
      categoryKey: aqi?.categoryKey ?? null,
      dominant: aqi?.dominant ?? null,
    },
    hourly,
    daily,
    aqi,
    units: {
      pm25: 'µg/m³',
      pm10: 'µg/m³',
      co: 'µg/m³',
      no2: 'µg/m³',
      so2: 'µg/m³',
      o3: 'µg/m³',
    },
    standard: AQI_STANDARD,
    source: {
      name: 'Open-Meteo Air Quality (CAMS)',
      url: 'https://open-meteo.com/en/docs/air-quality-api',
      model: 'CAMS global atmospheric composition model',
    },
  };
}
