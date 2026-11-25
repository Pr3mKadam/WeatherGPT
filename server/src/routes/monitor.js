import { Router } from 'express';
import { asyncHandler } from '../lib/utils.js';
import { parseCoords, parseName, cleanText } from '../lib/validate.js';
import { getHistory, monitorStatus, sampleLocation } from '../services/monitor.js';

const router = Router();

function readLocation(query) {
  const { lat, lon } = parseCoords(query);
  return {
    lat,
    lon,
    name: parseName(query.name),
    admin1: cleanText(query.admin1, 120),
    country: cleanText(query.country, 80),
  };
}

router.get('/status', (req, res) => {
  res.json(monitorStatus());
});

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const location = readLocation(req.query);
    const hours = req.query.hours;
    const data = await getHistory(location, { hours });
    res.json(data);
  })
);

router.post(
  '/sample',
  asyncHandler(async (req, res) => {
    const location = {
      lat: Number(req.body?.location?.lat),
      lon: Number(req.body?.location?.lon),
      name: parseName(req.body?.location?.name),
      admin1: cleanText(req.body?.location?.admin1, 120),
      country: cleanText(req.body?.location?.country, 80),
    };

    if (!Number.isFinite(location.lat) || location.lat < -90 || location.lat > 90) {
      return res.status(400).json({ error: 'A valid latitude is required.', code: 'invalid_latitude' });
    }
    if (!Number.isFinite(location.lon) || location.lon < -180 || location.lon > 180) {
      return res.status(400).json({ error: 'A valid longitude is required.', code: 'invalid_longitude' });
    }

    const result = await sampleLocation(location, { force: true });
    res.json({
      sampled: result.sampled,
      skipped: result.skipped,
      total: result.entry?.points?.length || 0,
      lastSampleAt: result.entry?.lastSampleAt || null,
      history: await getHistory(location, { hours: 24 }),
    });
  })
);

export default router;
