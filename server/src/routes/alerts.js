import { Router } from 'express';
import { asyncHandler } from '../lib/utils.js';
import { parseCoords, parseName, cleanText } from '../lib/validate.js';
import { getEnvironment } from '../services/environment.js';
import { ALERT_DISCLAIMER } from '../services/alerts.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { lat, lon } = parseCoords(req.query);
    const data = await getEnvironment({
      lat,
      lon,
      name: parseName(req.query.name),
      admin1: cleanText(req.query.admin1, 120),
      country: cleanText(req.query.country, 80),
    });
    res.json({
      location: data.location,
      alerts: data.alerts,
      disclaimer: ALERT_DISCLAIMER,
      fetchedAt: data.meta.fetchedAt,
      warnings: data.meta.warnings,
    });
  })
);

export default router;
