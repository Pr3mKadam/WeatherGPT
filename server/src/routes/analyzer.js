import { Router } from 'express';
import { asyncHandler } from '../lib/utils.js';
import { parseCoords, parseName, cleanText, parseDays } from '../lib/validate.js';
import { getAnalysis } from '../services/environment.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { lat, lon } = parseCoords(req.query);
    const days = parseDays(req.query.days, { min: 3, max: 14, fallback: 7 });
    const data = await getAnalysis({
      lat,
      lon,
      name: parseName(req.query.name),
      admin1: cleanText(req.query.admin1, 120),
      country: cleanText(req.query.country, 80),
      days,
    });
    res.json(data);
  })
);

export default router;
