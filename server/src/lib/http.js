import { ApiError } from './utils.js';

const USER_AGENT = 'WeatherGPT/1.0 (EVS college project; +https://open-meteo.com/)';

/**
 * Fetch JSON with a hard timeout and a friendly error surface.
 * Upstream error bodies are never forwarded verbatim to the browser.
 */
export async function fetchJson(
  url,
  { timeoutMs = 12000, headers = {}, service = 'data service', method = 'GET', body } = {}
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`[http] ${service} responded ${response.status}: ${body.slice(0, 200)}`);
      throw new ApiError(
        502,
        `${service} returned an error (HTTP ${response.status}). Please try again in a moment.`,
        'upstream_error',
        { status: response.status }
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError(
        504,
        `${service} took too long to respond. Please try again.`,
        'upstream_timeout'
      );
    }
    throw new ApiError(
      502,
      `Could not reach ${service}. Check the server's internet connection and try again.`,
      'upstream_unreachable',
      { reason: error.message }
    );
  } finally {
    clearTimeout(timer);
  }
}

export function buildUrl(base, params = {}) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}
