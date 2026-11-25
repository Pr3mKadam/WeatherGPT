import { Router } from 'express';
import { asyncHandler, ApiError } from '../lib/utils.js';
import { reportsStore } from '../db/index.js';
import { REPORT_KINDS } from '../data/defaults.js';
import { cleanText, parseLocation } from '../lib/validate.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const reports = await reportsStore.list(limit);
    res.json({ reports, count: reports.length });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const report = await reportsStore.get(req.params.id);
    if (!report) throw ApiError.notFound('That saved report does not exist.', 'report_not_found');
    res.json({ report });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const title = cleanText(body.title, 120);
    if (!title) throw ApiError.badRequest('A report title is required.', 'title_required');

    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const serialised = JSON.stringify(payload);
    if (serialised.length > 180000) {
      throw ApiError.badRequest('The report payload is too large.', 'payload_too_large');
    }

    const report = await reportsStore.create({
      title,
      kind: REPORT_KINDS.includes(body.kind) ? body.kind : 'custom',
      location: parseLocation(body.location) || undefined,
      summary: cleanText(body.summary, 800),
      notes: cleanText(body.notes, 2000),
      tags: Array.isArray(body.tags)
        ? body.tags.slice(0, 6).map((tag) => cleanText(tag, 30)).filter(Boolean)
        : [],
      payload,
    });

    res.status(201).json({ report });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const removed = await reportsStore.remove(req.params.id);
    if (!removed) throw ApiError.notFound('That saved report does not exist.', 'report_not_found');
    res.json({ removed: true, id: req.params.id });
  })
);

export default router;
