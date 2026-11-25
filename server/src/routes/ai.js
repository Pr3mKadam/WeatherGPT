import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler, ApiError } from '../lib/utils.js';
import { config } from '../config.js';
import { parseLocation, parseChatMessages, parseDays } from '../lib/validate.js';
import { settingsStore } from '../db/index.js';
import { getEnvironment, getAnalysis } from '../services/environment.js';
import {
  aiStatus,
  generateAnswer,
  generateBriefing,
  generateAnalyzerInsight,
  AI_DISCLAIMER,
} from '../services/groq.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.aiRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many AI requests from this device. Please wait a few minutes and try again.',
    code: 'ai_rate_limited',
  },
});

async function resolveLocation(body) {
  const parsed = parseLocation(body?.location);
  if (parsed) return parsed;
  const settings = await settingsStore.get();
  return { ...settings.defaultLocation };
}

router.get('/status', (req, res) => {
  res.json({ ...aiStatus(), disclaimer: AI_DISCLAIMER });
});

router.post(
  '/chat',
  limiter,
  asyncHandler(async (req, res) => {
    const messages = parseChatMessages(req.body?.messages);
    const location = await resolveLocation(req.body);

    const env = await getEnvironment({
      lat: location.lat,
      lon: location.lon,
      name: location.name,
      admin1: location.admin1,
      country: location.country,
    });

    const result = await generateAnswer({ messages, env });

    res.json({
      ...result,
      location: env.location,
      disclaimer: AI_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    });
  })
);

router.post(
  '/briefing',
  limiter,
  asyncHandler(async (req, res) => {
    const location = await resolveLocation(req.body);
    const env = await getEnvironment({
      lat: location.lat,
      lon: location.lon,
      name: location.name,
      admin1: location.admin1,
      country: location.country,
    });

    const result = await generateBriefing({ env });
    res.json({
      ...result,
      location: env.location,
      disclaimer: AI_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    });
  })
);

router.post(
  '/analyzer-insight',
  limiter,
  asyncHandler(async (req, res) => {
    const location = await resolveLocation(req.body);
    const days = parseDays(req.body?.days, { min: 3, max: 14, fallback: 7 });

    if (!location?.lat) throw ApiError.badRequest('A location is required.', 'location_required');

    const [env, analysis] = await Promise.all([
      getEnvironment({
        lat: location.lat,
        lon: location.lon,
        name: location.name,
        admin1: location.admin1,
        country: location.country,
      }),
      getAnalysis({
        lat: location.lat,
        lon: location.lon,
        name: location.name,
        admin1: location.admin1,
        country: location.country,
        days,
      }),
    ]);

    const result = await generateAnalyzerInsight({ env, analysis });
    res.json({
      ...result,
      disclaimer: AI_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    });
  })
);

export default router;
