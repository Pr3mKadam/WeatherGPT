import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { ApiError } from './lib/utils.js';
import { initStore, closeStore, storeInfo } from './db/index.js';
import { aiStatus } from './services/groq.js';

import healthRoutes from './routes/health.js';
import geoRoutes from './routes/geo.js';
import weatherRoutes from './routes/weather.js';
import airRoutes from './routes/air.js';
import environmentRoutes from './routes/environment.js';
import contentRoutes from './routes/content.js';
import climateRoutes from './routes/climate.js';
import analyzerRoutes from './routes/analyzer.js';
import alertsRoutes from './routes/alerts.js';
import riskRoutes from './routes/risk.js';
import aiRoutes from './routes/ai.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import monitorRoutes from './routes/monitor.js';
import waterRoutes from './routes/water.js';
import { startMonitoring, stopMonitoring } from './services/monitor.js';
import { settingsStore } from './db/index.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (config.clientOrigins.includes(origin)) return callback(null, true);
      if (!config.isProd && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(morgan(config.isProd ? 'combined' : 'dev'));

app.use('/api/health', healthRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/air', airRoutes);
app.use('/api/environment', environmentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/climate', climateRoutes);
app.use('/api/analyzer', analyzerRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/water', waterRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({
    error: `Unknown API route: ${req.method} ${req.originalUrl}`,
    code: 'route_not_found',
  });
});

const hasClientBuild = fs.existsSync(path.join(config.clientDist, 'index.html'));

if (hasClientBuild) {
  app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(config.clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'WeatherGPT API',
      status: 'running',
      message:
        'The React client has not been built yet. Run "npm run dev" for the Vite dev server, or "npm run build" then "npm start" to serve the built app.',
      endpoints: ['/api/health', '/api/environment', '/api/weather', '/api/air', '/api/geo/search?q=Pune'],
    });
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      error: 'The data did not pass validation.',
      code: 'validation_error',
      details: Object.keys(err.errors || {}),
    });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'The request body is too large.',
      code: 'payload_too_large',
    });
  }

  console.error('[error]', err);
  return res.status(500).json({
    error: 'Something went wrong on the server. Please try again.',
    code: 'internal_error',
  });
});

async function start() {
  await initStore();

  startMonitoring(async () => {
    const settings = await settingsStore.get();
    return settings?.defaultLocation || null;
  });

  const server = app.listen(config.port, () => {
    console.log('');
    console.log('  WeatherGPT API is running');
    console.log(`  → http://localhost:${config.port}/api/health`);
    console.log(`  → database: ${storeInfo().label}`);
    console.log(`  → monitoring: every ${config.monitoring.intervalMinutes} min → server/data/monitor.json`);
    console.log(`  → AI: ${aiStatus().configured ? `${aiStatus().provider} (${aiStatus().model})` : 'offline insight mode'}`);
    console.log(`  → client build: ${hasClientBuild ? 'served from client/dist' : 'not built (use the Vite dev server)'}`);
    console.log('');
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received — shutting down.`);
    stopMonitoring();
    server.close(async () => {
      await closeStore();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('[server] failed to start:', error);
  process.exit(1);
});
