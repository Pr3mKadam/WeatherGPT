import { ApiError, clamp } from './utils.js';

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export function parseCoords(query) {
  const lat = Number(query.lat ?? query.latitude);
  const lon = Number(query.lon ?? query.longitude ?? query.lng);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw ApiError.badRequest(
      'A valid latitude between -90 and 90 is required.',
      'invalid_latitude'
    );
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw ApiError.badRequest(
      'A valid longitude between -180 and 180 is required.',
      'invalid_longitude'
    );
  }

  return {
    lat: Math.round(lat * 10000) / 10000,
    lon: Math.round(lon * 10000) / 10000,
  };
}

export function cleanText(value, maxLength = 120) {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS, ' ').trim().slice(0, maxLength);
}

export function parseName(value, fallback = 'Selected location') {
  return cleanText(value, 120) || fallback;
}

export function parseDays(value, { min = 3, max = 14, fallback = 7 } = {}) {
  const days = Number(value);
  if (!Number.isFinite(days)) return fallback;
  return Math.round(clamp(days, min, max));
}

export function parseLocation(body) {
  if (!body || typeof body !== 'object') return null;
  const lat = Number(body.lat ?? body.latitude);
  const lon = Number(body.lon ?? body.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;
  return {
    name: parseName(body.name, 'Selected location'),
    admin1: cleanText(body.admin1, 120),
    country: cleanText(body.country, 80),
    lat: Math.round(lat * 10000) / 10000,
    lon: Math.round(lon * 10000) / 10000,
    timezone: cleanText(body.timezone, 80) || undefined,
  };
}

export function parseChatMessages(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw ApiError.badRequest('A non-empty messages array is required.', 'invalid_messages');
  }
  if (value.length > 12) {
    throw ApiError.badRequest('A conversation can contain at most 12 messages.', 'too_many_messages');
  }

  const messages = value.map((message) => {
    const role = message?.role === 'assistant' ? 'assistant' : 'user';
    const content = cleanText(message?.content, 4000);
    if (!content) {
      throw ApiError.badRequest('Each message needs non-empty content.', 'empty_message');
    }
    return { role, content };
  });

  const last = messages[messages.length - 1];
  if (last.role !== 'user') {
    throw ApiError.badRequest('The last message must come from the user.', 'invalid_last_message');
  }
  return messages;
}
