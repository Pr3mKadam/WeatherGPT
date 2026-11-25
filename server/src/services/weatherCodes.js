/**
 * WMO weather interpretation codes used by Open-Meteo.
 * https://open-meteo.com/en/docs
 */
const CODES = {
  0: { label: 'Clear sky', group: 'clear', nightLabel: 'Clear sky' },
  1: { label: 'Mainly clear', group: 'clear', nightLabel: 'Mainly clear' },
  2: { label: 'Partly cloudy', group: 'cloudy', nightLabel: 'Partly cloudy' },
  3: { label: 'Overcast', group: 'cloudy', nightLabel: 'Overcast' },
  45: { label: 'Fog', group: 'fog', nightLabel: 'Fog' },
  48: { label: 'Depositing rime fog', group: 'fog', nightLabel: 'Rime fog' },
  51: { label: 'Light drizzle', group: 'drizzle', nightLabel: 'Light drizzle' },
  53: { label: 'Moderate drizzle', group: 'drizzle', nightLabel: 'Moderate drizzle' },
  55: { label: 'Dense drizzle', group: 'drizzle', nightLabel: 'Dense drizzle' },
  56: { label: 'Light freezing drizzle', group: 'drizzle', nightLabel: 'Freezing drizzle' },
  57: { label: 'Dense freezing drizzle', group: 'drizzle', nightLabel: 'Freezing drizzle' },
  61: { label: 'Slight rain', group: 'rain', nightLabel: 'Slight rain' },
  63: { label: 'Moderate rain', group: 'rain', nightLabel: 'Moderate rain' },
  65: { label: 'Heavy rain', group: 'rain', nightLabel: 'Heavy rain' },
  66: { label: 'Light freezing rain', group: 'rain', nightLabel: 'Freezing rain' },
  67: { label: 'Heavy freezing rain', group: 'rain', nightLabel: 'Freezing rain' },
  71: { label: 'Slight snowfall', group: 'snow', nightLabel: 'Slight snowfall' },
  73: { label: 'Moderate snowfall', group: 'snow', nightLabel: 'Moderate snowfall' },
  75: { label: 'Heavy snowfall', group: 'snow', nightLabel: 'Heavy snowfall' },
  77: { label: 'Snow grains', group: 'snow', nightLabel: 'Snow grains' },
  80: { label: 'Slight rain showers', group: 'rain', nightLabel: 'Slight rain showers' },
  81: { label: 'Moderate rain showers', group: 'rain', nightLabel: 'Moderate rain showers' },
  82: { label: 'Violent rain showers', group: 'rain', nightLabel: 'Violent rain showers' },
  85: { label: 'Slight snow showers', group: 'snow', nightLabel: 'Slight snow showers' },
  86: { label: 'Heavy snow showers', group: 'snow', nightLabel: 'Heavy snow showers' },
  95: { label: 'Thunderstorm', group: 'storm', nightLabel: 'Thunderstorm' },
  96: { label: 'Thunderstorm with slight hail', group: 'storm', nightLabel: 'Thunderstorm with hail' },
  99: { label: 'Thunderstorm with heavy hail', group: 'storm', nightLabel: 'Thunderstorm with hail' },
};

const FALLBACK = { label: 'Unknown conditions', group: 'cloudy', nightLabel: 'Unknown conditions' };

export function describeWeather(code, isDay = true) {
  const entry = CODES[Number(code)] || FALLBACK;
  return {
    code: Number(code),
    label: isDay === false ? entry.nightLabel : entry.label,
    group: entry.group,
  };
}

export const WIND_COMPASS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

export function compassLabel(degrees) {
  if (!Number.isFinite(Number(degrees))) return '—';
  const index = Math.round((((Number(degrees) % 360) + 360) % 360) / 22.5) % 16;
  return WIND_COMPASS[index];
}

/** Human-friendly rainfall intensity from a 24-hour total (IMD-style categories). */
export function rainCategory(mm) {
  if (!Number.isFinite(Number(mm))) return 'Unavailable';
  const value = Number(mm);
  if (value < 2.5) return 'No meaningful rain';
  if (value < 15.6) return 'Light rain';
  if (value < 64.5) return 'Moderate rain';
  if (value < 115.6) return 'Heavy rain';
  if (value < 204.5) return 'Very heavy rain';
  return 'Extremely heavy rain';
}
