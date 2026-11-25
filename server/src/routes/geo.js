import { Router } from 'express';
import { asyncHandler, ApiError } from '../lib/utils.js';
import { cached } from '../lib/cache.js';
import { config } from '../config.js';
import { parseCoords } from '../lib/validate.js';
import { geocodeSearch, reverseGeocode } from '../services/openMeteo.js';

const router = Router();

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) {
      throw ApiError.badRequest('Type at least two characters to search for a place.', 'query_too_short');
    }
    if (query.length > 80) {
      throw ApiError.badRequest('Search text is too long.', 'query_too_long');
    }

    const results = await cached(
      `geo:${query.toLowerCase()}`,
      config.cache.geocode,
      () => geocodeSearch(query)
    );

    res.json({ query, results });
  })
);

router.get(
  '/reverse',
  asyncHandler(async (req, res) => {
    const { lat, lon } = parseCoords(req.query);
    const location = await cached(`reverse:${lat},${lon}`, 3600 * 1000, () =>
      reverseGeocode(lat, lon)
    );
    res.json({ location });
  })
);

export default router;
