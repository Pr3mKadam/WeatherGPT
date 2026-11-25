/**
 * Small, dependency-free helpers shared by the API layer.
 */

export class ApiError extends Error {
  constructor(status, message, code = 'api_error', details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, code = 'bad_request', details) {
    return new ApiError(400, message, code, details);
  }

  static notFound(message = 'The requested resource was not found.', code = 'not_found') {
    return new ApiError(404, message, code);
  }

  static upstream(message = 'The upstream data service is unavailable.', code = 'upstream_error') {
    return new ApiError(502, message, code);
  }
}

/** Wrap async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const round = (value, decimals = 1) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const isNum = (value) =>
  value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

export const numOrNull = (value) => (isNum(value) ? Number(value) : null);

/** Linear ramp: returns 0 below `low`, 100 above `high`. */
export const ramp = (value, low, high) => {
  if (!isNum(value)) return 0;
  return clamp(((Number(value) - low) / (high - low)) * 100, 0, 100);
};

export const mean = (values) => {
  const nums = values.filter(isNum).map(Number);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

export const sum = (values) => {
  const nums = values.filter(isNum).map(Number);
  return nums.reduce((a, b) => a + b, 0);
};

export const maxOf = (values) => {
  const nums = values.filter(isNum).map(Number);
  return nums.length ? Math.max(...nums) : null;
};

/** Pearson correlation coefficient. Returns null when there is not enough variation. */
export const pearson = (xs, ys) => {
  const pairs = xs
    .map((x, i) => [Number(x), Number(ys[i])])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const n = pairs.length;
  if (n < 8) return null;
  const mx = pairs.reduce((a, [x]) => a + x, 0) / n;
  const my = pairs.reduce((a, [, y]) => a + y, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
};

export const todayIso = () => new Date().toISOString();

export const safeJson = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
