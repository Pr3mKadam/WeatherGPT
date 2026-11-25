import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  Database,
  Info,
  Laptop,
  Leaf,
  MapPin,
  Moon,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Sun,
  Users,
} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import DataBadge from '../components/DataBadge.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { PageLoader } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEFAULT_LOCATION } from '../context/LocationContext.jsx';

const THRESHOLD_FIELDS = [
  { key: 'heavyRainMm', label: 'Heavy rain', unit: 'mm/day', min: 10, max: 300, step: 0.5, hint: 'IMD heavy-rain category starts at 64.5 mm/day.' },
  { key: 'veryHeavyRainMm', label: 'Very heavy rain', unit: 'mm/day', min: 20, max: 400, step: 1, hint: 'Must be greater than the heavy-rain threshold.' },
  { key: 'hourlyRainMm', label: 'Intense hourly rain', unit: 'mm/h', min: 2, max: 40, step: 0.5, hint: 'Used for a short-duration rain watch.' },
  { key: 'heatwaveC', label: 'Heatwave', unit: '°C', min: 30, max: 50, step: 0.5, hint: 'IMD plains heatwave criterion is 40 °C.' },
  { key: 'severeHeatC', label: 'Severe heat', unit: '°C', min: 35, max: 52, step: 0.5, hint: 'Must be greater than the heatwave threshold.' },
  { key: 'strongWindKmh', label: 'Strong wind', unit: 'km/h', min: 20, max: 150, step: 1, hint: 'Sustained or gust wind speed that triggers a wind advisory.' },
  { key: 'aqiPoor', label: 'Poor AQI', unit: 'AQI', min: 101, max: 400, step: 1, hint: 'CPCB “Poor” begins at 201.' },
  { key: 'aqiVeryPoor', label: 'Very poor AQI', unit: 'AQI', min: 201, max: 500, step: 1, hint: 'Must be greater than the poor-AQI threshold.' },
  { key: 'uvHigh', label: 'High UV', unit: 'index', min: 3, max: 12, step: 0.5, hint: 'WHO considers UV 8+ “very high”.' },
];

const TONES = [
  { value: 'concise', label: 'Concise', description: 'Short, direct answers.' },
  { value: 'detailed', label: 'Detailed', description: 'More explanation and context.' },
  { value: 'friendly', label: 'Friendly', description: 'Conversational and encouraging.' },
];

const APP_LOCATION = 'weathergpt.location.v1';

export default function Settings() {
  const { preference, setTheme } = useTheme();
  const { location, setLocation } = useLocation();
  const { notify } = useToast();

  const { data, loading, error, refresh } = useApi('/settings');
  const health = useApi('/health');
  const ai = useApi('/ai/status');

  const [thresholds, setThresholds] = useState({});
  const [aiTone, setAiTone] = useState('concise');
  const [defaultLocation, setDefaultLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    setThresholds(data.settings.thresholds);
    setAiTone(data.settings.aiTone || 'concise');
    setDefaultLocation(data.settings.defaultLocation);
    setDirty(false);
  }, [data]);

  const origin = useMemo(() => {
    if (typeof window === 'undefined') return 'http://localhost:5000';
    return window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin;
  }, []);

  async function save() {
    setSaving(true);
    try {
      const response = await api.put('/settings', {
        thresholds,
        aiTone,
        defaultLocation: defaultLocation || undefined,
      });
      setThresholds(response.settings.thresholds);
      setDefaultLocation(response.settings.defaultLocation);
      setDirty(false);
      notify('Settings saved.', 'success');
    } catch (requestError) {
      notify(requestError.message || 'Settings could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function updateThreshold(key, value) {
    setThresholds((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function useCurrentAsDefault() {
    setDefaultLocation({
      name: location.name,
      admin1: location.admin1,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
    });
    setDirty(true);
  }

  function usePuneDefault() {
    setDefaultLocation({ ...DEFAULT_LOCATION });
    setDirty(true);
  }

  function clearSavedLocation() {
    try {
      localStorage.removeItem(APP_LOCATION);
    } catch {
      /* ignore */
    }
    setLocation(defaultLocation || DEFAULT_LOCATION);
    notify('Browser location reset to the saved default.', 'info');
  }

  if (loading && !data) {
    return (
      <div className="page">
        <PageHeader eyebrow="Settings" title="Settings" description="Loading your preferences…" />
        <PageLoader label="Loading settings…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Settings" title="Settings" />
        <ErrorState title="Could not load settings" error={error} onRetry={refresh} />
      </div>
    );
  }

  const db = health.data?.database;
  const aiData = ai.data;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        description="Appearance, alert thresholds, the default location and the data behind the app."
        meta={
          <>
            <DataBadge status="live" label="Saved to the server" />
            <span className="meta-item">Thresholds affect the advisories and risk score</span>
          </>
        }
        actions={
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
            <Save size={16} />
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        }
      />

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Appearance</h2>
            <p className="card-subtitle">Choose how WeatherGPT looks on this device</p>
          </div>
          <Sun size={18} aria-hidden="true" />
        </div>
        <div className="theme-options">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Laptop },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <button
                type="button"
                key={option.value}
                className={`theme-option ${preference === option.value ? 'is-active' : ''}`.trim()}
                onClick={() => setTheme(option.value)}
                aria-pressed={preference === option.value}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{option.label}</span>
                {preference === option.value && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Default location</h2>
            <p className="card-subtitle">Used when the API needs a location and none is supplied</p>
          </div>
          <MapPin size={18} aria-hidden="true" />
        </div>

        <div className="default-location">
          <div>
            <strong>{defaultLocation?.name || 'Pune'}</strong>
            <span>
              {[defaultLocation?.admin1, defaultLocation?.country].filter(Boolean).join(', ') ||
                'Maharashtra, India'}
            </span>
            <em>
              {Number(defaultLocation?.lat).toFixed(4)}, {Number(defaultLocation?.lon).toFixed(4)}
            </em>
          </div>
          <div className="default-location-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={useCurrentAsDefault}>
              Use {location.name}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={usePuneDefault}>
              Reset to Pune
            </button>
          </div>
        </div>

        <div className="settings-inline-note">
          <Info size={14} aria-hidden="true" />
          <span>
            This device is currently showing <strong>{location.name}</strong>. You can reset the
            browser-stored location to the default above.
          </span>
          <button type="button" className="text-link" onClick={clearSavedLocation}>
            Reset this device
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Alert thresholds</h2>
            <p className="card-subtitle">Advisories and the risk score are recomputed against these values</p>
          </div>
          <SlidersHorizontal size={18} aria-hidden="true" />
        </div>

        <div className="threshold-grid">
          {THRESHOLD_FIELDS.map((field) => (
            <label className="threshold-field" key={field.key}>
              <span className="threshold-label">
                {field.label}
                <em>{field.unit}</em>
              </span>
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={thresholds[field.key] ?? ''}
                onChange={(event) => updateThreshold(field.key, event.target.value)}
              />
              <small>{field.hint}</small>
            </label>
          ))}
        </div>

        <p className="settings-note">
          The server validates every value and keeps dependent thresholds coherent: very-heavy rain
          must exceed heavy rain, severe heat must exceed the heatwave level, and very-poor AQI must
          exceed poor AQI.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Assistant tone</h2>
            <p className="card-subtitle">How much detail the AI should give by default</p>
          </div>
          <Bot size={18} aria-hidden="true" />
        </div>
        <div className="tone-options">
          {TONES.map((tone) => (
            <button
              type="button"
              key={tone.value}
              className={`tone-option ${aiTone === tone.value ? 'is-active' : ''}`.trim()}
              onClick={() => {
                setAiTone(tone.value);
                setDirty(true);
              }}
              aria-pressed={aiTone === tone.value}
            >
              <strong>{tone.label}</strong>
              <span>{tone.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Data sources and status</h2>
            <p className="card-subtitle">What is connected right now</p>
          </div>
          <Database size={18} aria-hidden="true" />
        </div>

        <div className="status-list">
          <div className="status-row">
            <div>
              <strong>Weather and air quality</strong>
              <span>Open-Meteo forecast + CAMS air-quality model</span>
            </div>
            <DataBadge status="live" label="Connected" />
          </div>
          <div className="status-row">
            <div>
              <strong>Database</strong>
              <span>{db?.label || 'Checking…'}</span>
            </div>
            <DataBadge
              status={db?.mode === 'mongodb' ? 'official' : 'estimated'}
              label={db?.mode === 'mongodb' ? 'MongoDB Atlas' : 'Local JSON fallback'}
            />
          </div>
          <div className="status-row">
            <div>
              <strong>AI assistant</strong>
              <span>{aiData?.note || 'Checking…'}</span>
            </div>
            <DataBadge
              status={aiData?.configured ? 'live' : 'estimated'}
              label={aiData?.configured ? `Groq · ${aiData.model}` : 'Offline insight mode'}
            />
          </div>
          <div className="status-row">
            <div>
              <strong>API base</strong>
              <span>{origin}/api</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { health.refresh(); ai.refresh(); }}>
              <RefreshCw size={13} />
              Refresh status
            </button>
          </div>
        </div>

        {db?.note && <p className="settings-note">{db.note}</p>}
      </section>

      <section className="card project-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">About this project</h2>
            <p className="card-subtitle">Environmental Studies mini project</p>
          </div>
          <Leaf size={18} aria-hidden="true" />
        </div>
        <div className="project-grid">
          <div>
            <span>Institution</span>
            <strong>MIT Academy of Engineering, Alandi, Pune</strong>
          </div>
          <div>
            <span>Department · Class</span>
            <strong>Information Technology · IT A1</strong>
          </div>
          <div>
            <span>Academic year</span>
            <strong>2026–27</strong>
          </div>
          <div>
            <span>Team</span>
            <strong className="project-team">
              <Users size={14} aria-hidden="true" />
              Samyak Chordiya · Prem Kadam · Yash Deore · Harshali Rajput
            </strong>
          </div>
        </div>
        <p className="settings-note">
          WeatherGPT is an academic awareness project. It is not affiliated with IMD, CPCB,
          Open-Meteo or Groq, and it is not an official warning service.
        </p>
      </section>

      <SourceNote
        className="page-source-note"
        sources={[
          { name: 'Open-Meteo', url: 'https://open-meteo.com/' },
          { name: 'CPCB', url: 'https://cpcb.nic.in/' },
          { name: 'IMD', url: 'https://mausam.imd.gov.in/' },
          { name: 'Groq', url: 'https://groq.com/' },
        ]}
      >
        Weather and air-quality values are model outputs, the AQI is a CPCB-style estimate, and
        advisories are computed by this project. Always check official sources for safety decisions.
      </SourceNote>
    </div>
  );
}
