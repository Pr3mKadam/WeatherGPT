const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, code = 'api_error', details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      'Could not reach the WeatherGPT server. Make sure the API is running on port 5000.',
      0,
      'network_error'
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || `The server responded with HTTP ${response.status}.`,
      response.status,
      data?.code,
      data?.details
    );
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export function locationParams(location) {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lon),
    name: location.name || 'Selected location',
  });
  if (location.admin1) params.set('admin1', location.admin1);
  if (location.country) params.set('country', location.country);
  return params.toString();
}

export function withLocation(path, location, extra = {}) {
  const params = new URLSearchParams(locationParams(location));
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return `${path}?${params.toString()}`;
}
