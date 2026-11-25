import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    admin1: { type: String, trim: true, maxlength: 120 },
    country: { type: String, trim: true, maxlength: 80 },
    lat: Number,
    lon: Number,
    timezone: { type: String, maxlength: 80 },
  },
  { _id: false }
);

const ReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    kind: {
      type: String,
      enum: ['weather', 'air', 'risk', 'analysis', 'climate', 'custom'],
      default: 'custom',
    },
    location: { type: LocationSchema, default: undefined },
    summary: { type: String, trim: true, maxlength: 800, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ kind: 1 });

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'app' },
    thresholds: {
      heavyRainMm: { type: Number, default: 64.5 },
      veryHeavyRainMm: { type: Number, default: 115.6 },
      hourlyRainMm: { type: Number, default: 7.5 },
      heatwaveC: { type: Number, default: 40 },
      severeHeatC: { type: Number, default: 45 },
      strongWindKmh: { type: Number, default: 50 },
      aqiPoor: { type: Number, default: 201 },
      aqiVeryPoor: { type: Number, default: 301 },
      uvHigh: { type: Number, default: 8 },
    },
    units: { type: String, enum: ['metric'], default: 'metric' },
    defaultLocation: { type: LocationSchema, default: undefined },
    aiTone: { type: String, enum: ['concise', 'detailed', 'friendly'], default: 'concise' },
  },
  { timestamps: true }
);

export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
