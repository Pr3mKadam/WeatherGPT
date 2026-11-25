import { Router } from 'express';
import { asyncHandler, ApiError } from '../lib/utils.js';
import { settingsStore } from '../db/index.js';
import { THRESHOLD_LIMITS, DEFAULT_THRESHOLDS } from '../data/defaults.js';
import { parseLocation } from '../lib/validate.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await settingsStore.get();
    res.json({ settings });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const patch = {};

    if (body.thresholds !== undefined) {
      if (!body.thresholds || typeof body.thresholds !== 'object') {
        throw ApiError.badRequest('thresholds must be an object.', 'invalid_thresholds');
      }
      const thresholds = {};
      for (const [key, limits] of Object.entries(THRESHOLD_LIMITS)) {
        if (body.thresholds[key] === undefined) continue;
        const value = Number(body.thresholds[key]);
        if (!Number.isFinite(value) || value < limits[0] || value > limits[1]) {
          throw ApiError.badRequest(
            `${key} must be a number between ${limits[0]} and ${limits[1]}.`,
            'invalid_threshold',
            { key, min: limits[0], max: limits[1] }
          );
        }
        thresholds[key] = value;
      }
      // Keep dependent thresholds coherent.
      const merged = { ...DEFAULT_THRESHOLDS, ...thresholds };
      if (merged.veryHeavyRainMm <= merged.heavyRainMm) {
        throw ApiError.badRequest(
          'The very-heavy rain threshold must be greater than the heavy-rain threshold.',
          'inconsistent_thresholds'
        );
      }
      if (merged.severeHeatC <= merged.heatwaveC) {
        throw ApiError.badRequest(
          'The severe-heat threshold must be greater than the heatwave threshold.',
          'inconsistent_thresholds'
        );
      }
      if (merged.aqiVeryPoor <= merged.aqiPoor) {
        throw ApiError.badRequest(
          'The very-poor AQI threshold must be greater than the poor AQI threshold.',
          'inconsistent_thresholds'
        );
      }
      patch.thresholds = thresholds;
    }

    if (body.defaultLocation !== undefined) {
      const location = parseLocation(body.defaultLocation);
      if (!location) {
        throw ApiError.badRequest('defaultLocation needs valid lat/lon values.', 'invalid_location');
      }
      patch.defaultLocation = location;
    }

    if (body.aiTone !== undefined) {
      if (!['concise', 'detailed', 'friendly'].includes(body.aiTone)) {
        throw ApiError.badRequest('aiTone must be concise, detailed or friendly.', 'invalid_tone');
      }
      patch.aiTone = body.aiTone;
    }

    const settings = await settingsStore.save(patch);
    res.json({ settings });
  })
);

export default router;
