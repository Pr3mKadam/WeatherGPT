import { Router } from 'express';
import { cacheSnapshot } from '../lib/cache.js';
import { storeInfo } from '../db/index.js';
import { aiStatus } from '../services/groq.js';
import { monitorStatus } from '../services/monitor.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'WeatherGPT API',
    version: '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
    database: storeInfo(),
    ai: aiStatus(),
    monitoring: monitorStatus(),
    cache: cacheSnapshot(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
