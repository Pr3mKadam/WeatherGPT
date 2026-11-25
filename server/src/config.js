import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(here, '..');
export const repoRoot = path.resolve(serverRoot, '..');

// Root .env first, then an optional server/.env (does not override existing vars).
dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env') });

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const list = (value, fallback = []) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .concat(fallback)
    .filter((v, i, arr) => arr.indexOf(v) === i);

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: num(process.env.PORT, 5000),
  serverRoot,
  repoRoot,
  clientDist: path.join(repoRoot, 'client', 'dist'),
  clientOrigins: list(
    process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173'
  ),
  mongoUri: (process.env.MONGODB_URI || '').trim(),
  googleApiKey: (process.env.GOOGLE_API_KEY || '').trim(),
  gemini: {
    apiKey: (process.env.GEMINI_API_KEY || '').trim(),
    model: (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim(),
    fallbackModels: list(process.env.GEMINI_FALLBACK_MODELS, ['gemini-3.5-flash-lite']),
    maxTokens: num(process.env.GEMINI_MAX_TOKENS, 900),
    temperature: num(process.env.GEMINI_TEMPERATURE, 0.4),
    timeoutMs: num(process.env.GEMINI_TIMEOUT_MS, 30000),
  },
  groq: {
    apiKey: (process.env.GROQ_API_KEY || '').trim(),
    baseUrl: (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
    model: (process.env.GROQ_MODEL || 'openai/gpt-oss-120b').trim(),
    fallbackModels: list(process.env.GROQ_FALLBACK_MODELS, ['openai/gpt-oss-20b']),
    maxTokens: num(process.env.GROQ_MAX_TOKENS, 900),
    temperature: num(process.env.GROQ_TEMPERATURE, 0.4),
    timeoutMs: num(process.env.GROQ_TIMEOUT_MS, 30000),
  },
  cache: {
    weather: num(process.env.CACHE_TTL_WEATHER, 600) * 1000,
    air: num(process.env.CACHE_TTL_AIR, 900) * 1000,
    geocode: num(process.env.CACHE_TTL_GEOCODE, 86400) * 1000,
    climate: num(process.env.CACHE_TTL_CLIMATE, 86400) * 1000,
    analyzer: num(process.env.CACHE_TTL_ANALYZER, 1800) * 1000,
    flood: num(process.env.CACHE_TTL_FLOOD, 3600) * 1000,
    ai: num(process.env.CACHE_TTL_AI, 900) * 1000,
  },
  monitoring: {
    enabled: (process.env.MONITOR_ENABLED || 'true').toLowerCase() !== 'false',
    intervalMinutes: Math.max(1, num(process.env.MONITOR_INTERVAL_MINUTES, 10)),
    retentionDays: Math.max(1, num(process.env.MONITOR_RETENTION_DAYS, 7)),
    maxPoints: Math.max(24, num(process.env.MONITOR_MAX_POINTS, 1000)),
  },
  aiRateLimit: num(process.env.AI_RATE_LIMIT, 40),
  climateModel: (process.env.CLIMATE_MODEL || 'MRI_AGCM3_2_S').trim(),
  dataDir: path.join(serverRoot, 'data'),
  storeFile: path.join(serverRoot, 'data', 'store.json'),
  monitorFile: path.join(serverRoot, 'data', 'monitor.json'),
  jsonBodyLimit: '300kb',
};
