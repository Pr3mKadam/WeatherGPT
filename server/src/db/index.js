import mongoose from 'mongoose';
import { config } from '../config.js';
import { Report, Settings } from './models.js';
import { jsonStore } from './jsonStore.js';
import { DEFAULT_SETTINGS, mergeSettings } from '../data/defaults.js';

let mode = 'file';

export function storeMode() {
  return mode;
}

export function storeInfo() {
  return {
    mode,
    label: mode === 'mongodb' ? 'MongoDB Atlas' : 'Local JSON store',
    persistent: true,
    note:
      mode === 'mongodb'
        ? 'Reports and alert thresholds are saved in MongoDB Atlas.'
        : 'MONGODB_URI is not configured (or Atlas was unreachable), so reports are saved to server/data/store.json. Add MONGODB_URI to use Atlas.',
  };
}

export async function initStore() {
  if (!config.mongoUri) {
    await jsonStore.init();
    mode = 'file';
    console.log('[db] MONGODB_URI not set — using local JSON store (server/data/store.json).');
    return mode;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
    mode = 'mongodb';
    await Settings.findOneAndUpdate(
      { key: 'app' },
      { $setOnInsert: { ...DEFAULT_SETTINGS, key: 'app' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('[db] connected to MongoDB Atlas');
  } catch (error) {
    console.warn(`[db] MongoDB unavailable (${error.message}). Falling back to local JSON store.`);
    mode = 'file';
    await jsonStore.init();
  }

  return mode;
}

function serializeReport(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    kind: doc.kind,
    location: doc.location,
    summary: doc.summary || '',
    notes: doc.notes || '',
    tags: doc.tags || [],
    payload: doc.payload || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const reportsStore = {
  async list(limit = 50) {
    if (mode === 'mongodb') {
      const docs = await Report.find().sort({ createdAt: -1 }).limit(limit).lean();
      return docs.map(serializeReport);
    }
    return jsonStore.listReports(limit);
  },

  async get(id) {
    if (mode === 'mongodb') {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await Report.findById(id).lean();
      return doc ? serializeReport(doc) : null;
    }
    return jsonStore.getReport(id);
  },

  async create(data) {
    if (mode === 'mongodb') {
      const doc = await Report.create(data);
      return serializeReport(doc.toObject());
    }
    return jsonStore.createReport(data);
  },

  async remove(id) {
    if (mode === 'mongodb') {
      if (!mongoose.isValidObjectId(id)) return false;
      const result = await Report.findByIdAndDelete(id);
      return Boolean(result);
    }
    return jsonStore.deleteReport(id);
  },
};

export const settingsStore = {
  async get() {
    if (mode === 'mongodb') {
      const doc = await Settings.findOne({ key: 'app' }).lean();
      return mergeSettings(doc);
    }
    return jsonStore.getSettings();
  },

  async save(patch) {
    const current = await settingsStore.get();
    const next = mergeSettings({
      ...current,
      ...patch,
      thresholds: { ...current.thresholds, ...(patch?.thresholds || {}) },
      defaultLocation: { ...current.defaultLocation, ...(patch?.defaultLocation || {}) },
      updatedAt: new Date().toISOString(),
    });

    if (mode === 'mongodb') {
      await Settings.findOneAndUpdate({ key: 'app' }, next, { upsert: true, new: true });
    } else {
      await jsonStore.saveSettings(next);
    }
    return next;
  },
};

export async function closeStore() {
  if (mode === 'mongodb') {
    await mongoose.disconnect();
  }
}
