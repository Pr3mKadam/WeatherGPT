import { Router } from 'express';
import { asyncHandler } from '../lib/utils.js';
import { parseCoords, parseName, cleanText } from '../lib/validate.js';
import { getWeatherOnly } from '../services/environment.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { lat, lon } = parseCoords(req.query);
    const data = await getWeatherOnly({
      lat,
      lon,
      name: parseName(req.query.name),
      admin1: cleanText(req.query.admin1, 120),
      country: cleanText(req.query.country, 80),
    });
    res.json(data);
  })
);

export default router;
