import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { DEFAULT_SETTINGS, mergeSettings } from '../data/defaults.js';

/**
 * Zero-configuration fallback store used when MONGODB_URI is not set (or Atlas
 * is unreachable). Data lives in server/data/store.json and writes are queued
 * and atomic within this single process.
 */
let queue = Promise.resolve();
const MAX_REPORTS = 300;

async function readData() {
  try {
    const raw = await fs.readFile(config.storeFile, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      settings: parsed.settings || null,
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { reports: [], settings: null };
    if (error instanceof SyntaxError) {
      console.warn('[db] store.json was not valid JSON; starting a fresh store.');
      return { reports: [], settings: null };
    }
    throw error;
  }
}

async function writeData(data) {
  await fs.mkdir(config.dataDir, { recursive: true });
  const temp = `${config.storeFile}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(temp, config.storeFile);
}

function mutate(producer) {
  queue = queue.catch(() => {}).then(async () => {
    const data = await readData();
    const result = await producer(data);
    await writeData(data);
    return result;
  });
  return queue;
}

export const jsonStore = {
  async init() {
    await fs.mkdir(config.dataDir, { recursive: true });
    const data = await readData();
    if (!data.settings) {
      data.settings = { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
      await writeData(data);
    }
  },

  async listReports(limit = 50) {
    const data = await readData();
    return data.reports
      .slice()
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, limit);
  },

  async getReport(id) {
    const data = await readData();
    return data.reports.find((report) => report.id === id) || null;
  },

  async createReport(report) {
    return mutate((data) => {
      const created = {
        ...report,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.reports.unshift(created);
      if (data.reports.length > MAX_REPORTS) data.reports.length = MAX_REPORTS;
      return created;
    });
  },

  async deleteReport(id) {
    return mutate((data) => {
      const index = data.reports.findIndex((report) => report.id === id);
      if (index === -1) return false;
      data.reports.splice(index, 1);
      return true;
    });
  },

  async getSettings() {
    const data = await readData();
    return mergeSettings(data.settings);
  },

  async saveSettings(settings) {
    return mutate((data) => {
      data.settings = settings;
      return settings;
    });
  },
};
