import { useEffect, useMemo, useState } from 'react';
import {
  Apple,
  Bus,
  Check,
  CloudRain,
  Droplets,
  Fan,
  Flower2,
  Gauge,
  Leaf,
  Lightbulb,
  PlugZap,
  Recycle,
  Salad,
  ShoppingBag,
  Sprout,
  Sun,
  Target,
  Thermometer,
  Trees,
  Utensils,
  Waves,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';
import DataBadge from '../components/DataBadge.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { PageLoader } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatNumber } from '../lib/format.js';

const STORAGE_KEY = 'weathergpt.footprint.v1';

const DEFAULT_INPUTS = {
  carKmPerWeek: '40',
  twoWheelerKmPerWeek: '30',
  busKmPerWeek: '20',
  metroKmPerWeek: '0',
  electricityKwhPerMonth: '180',
  lpgCylindersPerMonth: '1',
  shortFlightsPerYear: '0',
  longFlightsPerYear: '0',
  diet: 'mixed',
};

const FIELD_LABELS = {
  carKmPerWeek: { label: 'Car travel', unit: 'km per week', icon: Bus },
  twoWheelerKmPerWeek: { label: 'Two-wheeler', unit: 'km per week', icon: Bus },
  busKmPerWeek: { label: 'Bus travel', unit: 'km per week', icon: Bus },
  metroKmPerWeek: { label: 'Metro travel', unit: 'km per week', icon: Bus },
  electricityKwhPerMonth: { label: 'Electricity', unit: 'kWh per month', icon: PlugZap },
  lpgCylindersPerMonth: { label: 'LPG cylinders', unit: 'per month', icon: Thermometer },
  shortFlightsPerYear: { label: 'Short flights', unit: 'per year', icon: CloudRain },
  longFlightsPerYear: { label: 'Long flights', unit: 'per year', icon: CloudRain },
};

const ACTION_ICONS = {
  bus: Bus,
  lightbulb: Lightbulb,
  thermometer: Thermometer,
  salad: Salad,
  sprout: Sprout,
  utensils: Utensils,
  trees: Trees,
  'plug-zap': PlugZap,
  sun: Sun,
  'cloud-rain': CloudRain,
};

const TIP_ICONS = {
  recycle: Recycle,
  bus: Bus,
  fan: Fan,
  'shopping-bag': ShoppingBag,
  droplets: Droplets,
  apple: Apple,
  waves: Waves,
  target: Target,
};

function readInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INPUTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_INPUTS, ...(parsed.inputs || {}) };
  } catch {
    return DEFAULT_INPUTS;
  }
}

function readActions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.actions) ? parsed.actions : [];
  } catch {
    return [];
  }
}

function numeric(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function Sustainability() {
  const { data, loading, error, refresh } = useApi('/content/sustainability');
  const [inputs, setInputs] = useState(readInputs);
  const [selected, setSelected] = useState(readActions);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, actions: selected }));
    } catch {
      /* storage may be unavailable */
    }
  }, [inputs, selected]);

  const totals = useMemo(() => {
    if (!data) return null;
    const f = data.calculator.factors;
    const rows = [
      { key: 'car', label: 'Car', kg: numeric(inputs.carKmPerWeek) * 52 * f.carKgPerKm },
      { key: 'twoWheeler', label: 'Two-wheeler', kg: numeric(inputs.twoWheelerKmPerWeek) * 52 * f.twoWheelerKgPerKm },
      { key: 'bus', label: 'Bus', kg: numeric(inputs.busKmPerWeek) * 52 * f.busKgPerKm },
      { key: 'metro', label: 'Metro', kg: numeric(inputs.metroKmPerWeek) * 52 * f.metroKgPerKm },
      { key: 'electricity', label: 'Electricity', kg: numeric(inputs.electricityKwhPerMonth) * 12 * f.electricityKgPerKwh },
      { key: 'lpg', label: 'LPG', kg: numeric(inputs.lpgCylindersPerMonth) * 12 * f.lpgKgPerCylinder },
      {
        key: 'flights',
        label: 'Flights',
        kg:
          numeric(inputs.shortFlightsPerYear) * f.shortFlightKg +
          numeric(inputs.longFlightsPerYear) * f.longFlightKg,
      },
      { key: 'diet', label: 'Diet', kg: f.dietKgPerYear[inputs.diet] ?? f.dietKgPerYear.mixed },
    ].map((row) => ({ ...row, kg: Math.round(row.kg) }));

    const totalKg = rows.reduce((sum, row) => sum + row.kg, 0);
    return { rows, totalKg, tonnes: totalKg / 1000 };
  }, [data, inputs]);

  const savings = useMemo(() => {
    if (!data) return { kg: 0, water: 0 };
    return data.actions.reduce(
      (acc, action) => {
        if (!selected.includes(action.id)) return acc;
        return {
          kg: acc.kg + (action.savingKgPerYear || 0),
          water: acc.water + (action.waterLitresPerYear || 0),
        };
      },
      { kg: 0, water: 0 }
    );
  }, [data, selected]);

  if (loading && !data) {
    return (
      <div className="page">
        <PageHeader eyebrow="Sustainability" title="Everyday sustainability" description="Loading the calculator…" />
        <PageLoader label="Loading sustainability content…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Sustainability" title="Everyday sustainability" />
        <ErrorState title="Could not load the sustainability module" error={error} onRetry={refresh} />
      </div>
    );
  }

  const comparison = data.calculator.comparisons;
  const indiaAverage = comparison.find((item) => item.key === 'india')?.tonnes || 2;
  const worldAverage = comparison.find((item) => item.key === 'world')?.tonnes || 4.7;
  const maxComparison = Math.max(totals.tonnes, worldAverage, indiaAverage, 1);
  const colours = ['#2FB37A', '#4D9FD4', '#E2A63B', '#8A6BD4', '#E07B3C', '#54D69C', '#7CB342', '#5BA7D9'];

  function update(key, value) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function toggleAction(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Sustainability"
        title={data.title}
        description={data.subtitle}
        meta={
          <>
            <DataBadge status="estimated" label="Indicative estimate" />
            <span className="meta-item">Updated {data.updated}</span>
          </>
        }
      />

      <div className="inline-warning">
        <Leaf size={16} aria-hidden="true" />
        <span>{data.intro}</span>
      </div>

      <div className="calc-layout">
        <section className="card calc-inputs">
          <div className="card-head">
            <div>
              <h2 className="card-title">{data.calculator.title}</h2>
              <p className="card-subtitle">Adjust the inputs to match a typical month</p>
            </div>
            <Gauge size={18} aria-hidden="true" />
          </div>

          <div className="calc-field-grid">
            {Object.entries(FIELD_LABELS).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <label className="calc-field" key={key}>
                  <span className="calc-field-label">
                    <Icon size={14} aria-hidden="true" />
                    {meta.label}
                  </span>
                  <span className="calc-field-input">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="decimal"
                      value={inputs[key]}
                      onChange={(event) => update(key, event.target.value)}
                    />
                    <em>{meta.unit}</em>
                  </span>
                </label>
              );
            })}

            <label className="calc-field calc-field-wide">
              <span className="calc-field-label">
                <Salad size={14} aria-hidden="true" />
                Diet pattern
              </span>
              <select value={inputs.diet} onChange={(event) => update('diet', event.target.value)}>
                <option value="vegetarian">Mostly vegetarian</option>
                <option value="mixed">Mixed diet</option>
                <option value="high-meat">High meat</option>
              </select>
            </label>
          </div>

          <p className="calc-disclaimer">{data.calculator.disclaimer}</p>
        </section>

        <section className="card calc-result">
          <span className="eyebrow-small">
            <Leaf size={13} aria-hidden="true" />
            Your indicative footprint
          </span>
          <div className="footprint-number">
            {formatNumber(totals.tonnes, 2)}
            <span>tonnes CO₂e / year</span>
          </div>
          <p className="footprint-note">
            About {formatNumber(totals.totalKg, 0)} kg CO₂e per year. That is an average, not a
            measurement.
          </p>

          <div className="footprint-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totals.rows.filter((row) => row.kg > 0)}
                  dataKey="kg"
                  nameKey="label"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >
                  {totals.rows.filter((row) => row.kg > 0).map((row, index) => (
                    <Cell key={row.key} fill={colours[index % colours.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${formatNumber(value, 0)} kg`, name]}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 12,
                    color: 'var(--text)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="breakdown-list">
            {totals.rows.map((row, index) => (
              <div className="breakdown-row" key={row.key}>
                <span className="breakdown-dot" style={{ background: colours[index % colours.length] }} />
                <span>{row.label}</span>
                <strong>{formatNumber(row.kg, 0)} kg</strong>
                <em>{totals.totalKg ? Math.round((row.kg / totals.totalKg) * 100) : 0}%</em>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">How your estimate compares</h2>
            <p className="card-subtitle">Broad national and global averages, for context only</p>
          </div>
          <DataBadge status="estimated" />
        </div>
        <div className="compare-list">
          <div className="compare-row">
            <span>Your estimate</span>
            <div className="compare-track">
              <span style={{ width: `${(totals.tonnes / maxComparison) * 100}%`, background: 'var(--primary)' }} />
            </div>
            <strong>{formatNumber(totals.tonnes, 2)} t</strong>
          </div>
          {comparison.map((item, index) => (
            <div className="compare-row" key={item.key}>
              <span>{item.label}</span>
              <div className="compare-track">
                <span
                  style={{
                    width: `${(item.tonnes / maxComparison) * 100}%`,
                    background: ['var(--blue)', 'var(--amber)', 'var(--accent)'][index % 3],
                  }}
                />
              </div>
              <strong>{formatNumber(item.tonnes, 1)} t</strong>
            </div>
          ))}
        </div>
        <p className="compare-note">
          National and global averages hide enormous variation between households. Use this to
          compare magnitudes, not to rank people.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Actions worth taking</h2>
            <p className="card-subtitle">Tick what you already do, or plan to start</p>
          </div>
          <DataBadge status="estimated" label="Indicative savings" />
        </div>

        <div className="sustain-summary">
          <div>
            <span>Selected actions</span>
            <strong>{selected.length} of {data.actions.length}</strong>
          </div>
          <div>
            <span>Estimated CO₂ saving</span>
            <strong>{formatNumber(savings.kg, 0)} kg / year</strong>
          </div>
          {savings.water > 0 && (
            <div>
              <span>Estimated water saving</span>
              <strong>{formatNumber(savings.water, 0)} L / year</strong>
            </div>
          )}
        </div>

        <div className="sustain-action-grid">
          {data.actions.map((action) => {
            const Icon = ACTION_ICONS[action.icon] || Leaf;
            const isSelected = selected.includes(action.id);
            return (
              <button
                type="button"
                key={action.id}
                className={`sustain-action ${isSelected ? 'is-selected' : ''}`.trim()}
                onClick={() => toggleAction(action.id)}
                aria-pressed={isSelected}
              >
                <span className="sustain-action-icon" aria-hidden="true">
                  {isSelected ? <Check size={17} /> : <Icon size={17} />}
                </span>
                <span className="sustain-action-copy">
                  <strong>{action.title}</strong>
                  <p>{action.detail}</p>
                  <small>
                    {action.savingKgPerYear > 0
                      ? `≈ ${formatNumber(action.savingKgPerYear, 0)} kg CO₂ / year`
                      : action.waterLitresPerYear
                        ? `≈ ${formatNumber(action.waterLitresPerYear, 0)} L water / year`
                        : 'Non-emissions benefit'}
                    {' · '}
                    {action.difficulty}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Everyday habits, especially in Pune</h2>
            <p className="card-subtitle">Low-effort changes that add up over a year</p>
          </div>
        </div>
        <div className="tip-grid">
          {data.tips.map((tip) => {
            const Icon = TIP_ICONS[tip.icon] || Leaf;
            return (
              <article className="tip-block" key={tip.title}>
                <span className="tip-block-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div>
                  <h3>{tip.title}</h3>
                  <p>{tip.detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <SourceNote
        className="page-source-note"
        sources={data.references.map((reference) => ({ name: reference.label, url: reference.url }))}
      >
        Emission factors: {data.calculator.factorNotes.join(' ')}
      </SourceNote>
    </div>
  );
}
