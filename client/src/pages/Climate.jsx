import {
  AlertTriangle,
  ArrowUpRight,
  Bird,
  Bus,
  CloudRain,
  Droplets,
  Factory,
  Flame,
  Globe2,
  Leaf,
  Mountain,
  Radio,
  Recycle,
  Snowflake,
  Sprout,
  Sun,
  Thermometer,
  Trees,
  Waves,
  Wheat,
  Wind,
  Zap,
  HeartPulse,
  Siren,
} from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';
import ChartCard from '../components/ChartCard.jsx';
import DataBadge from '../components/DataBadge.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { PageLoader, SkeletonCard } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { locationParams } from '../lib/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import { formatNumber } from '../lib/format.js';

const ICONS = {
  factory: Factory,
  beef: Factory,
  sprout: Sprout,
  snowflake: Snowflake,
  'thermometer-sun': Thermometer,
  'cloud-rain-wind': CloudRain,
  'mountain-snow': Mountain,
  waves: Waves,
  wheat: Wheat,
  droplets: Droplets,
  bird: Bird,
  'heart-pulse': HeartPulse,
  sun: Sun,
  zap: Zap,
  bus: Bus,
  trees: Trees,
  flame: Flame,
  recycle: Recycle,
  siren: Siren,
  'cloud-rain': CloudRain,
  radio: Radio,
};

function IconFor({ name, size = 20 }) {
  const Icon = ICONS[name] || Leaf;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}

function AnomalyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-title">{label}</span>
      <div className="chart-tooltip-row">
        <span className="chart-dot" style={{ background: '#2FB37A' }} />
        <span>Warming vs 1951–1980</span>
        <strong>
          {point?.anomaly > 0 ? '+' : ''}
          {formatNumber(point?.anomaly, 2)} °C
        </strong>
      </div>
      <div className="chart-tooltip-sub">
        Annual mean {formatNumber(point?.temp, 2)} °C · rain {formatNumber(point?.precip, 0)} mm
      </div>
    </div>
  );
}

function DecadeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-title">{label}</span>
      {payload.map((item) => (
        <div className="chart-tooltip-row" key={item.dataKey}>
          <span className="chart-dot" style={{ background: item.color || item.fill }} />
          <span>{item.name}</span>
          <strong>
            {formatNumber(item.value, item.dataKey === 'precip' ? 0 : 2)}
            {item.dataKey === 'precip' ? ' mm' : ' °C'}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ProjectionSection() {
  const { location } = useLocation();
  const path = `/climate/projection?${locationParams(location)}&model=`;
  const { data, loading, error, refresh } = useApi(path);

  if (loading && !data) {
    return (
      <div className="two-col-grid">
        <SkeletonCard height={300} lines={3} />
        <SkeletonCard height={300} lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load the climate projection"
        error={error}
        onRetry={refresh}
        compact
      />
    );
  }

  const chartData = data.annual.map((row) => ({
    year: row.year,
    anomaly: row.anomaly,
    temp: row.temp,
    precip: row.precip,
  }));

  return (
    <>
      <div className="climate-stats">
        <article className="card climate-stat">
          <span>Baseline · {data.baseline.period}</span>
          <strong>{formatNumber(data.baseline.tempMean, 2)} °C</strong>
          <p>Modelled annual mean for {location.name}</p>
        </article>
        <article className="card climate-stat">
          <span>Recent · {data.recent.period}</span>
          <strong>{formatNumber(data.recent.tempMean, 2)} °C</strong>
          <p>
            {data.recent.anomaly >= 0 ? '+' : ''}
            {formatNumber(data.recent.anomaly, 2)} °C vs baseline
          </p>
        </article>
        <article className="card climate-stat">
          <span>Projected · {data.projected.period}</span>
          <strong>{formatNumber(data.projected.tempMean, 2)} °C</strong>
          <p>
            {data.projected.anomaly >= 0 ? '+' : ''}
            {formatNumber(data.projected.anomaly, 2)} °C vs baseline
          </p>
        </article>
        <article className="card climate-stat">
          <span>Warming rate</span>
          <strong>
            {data.warmingRatePerDecade === null
              ? '—'
              : `${data.warmingRatePerDecade > 0 ? '+' : ''}${formatNumber(data.warmingRatePerDecade, 2)} °C`}
          </strong>
          <p>Per decade, linear trend in the simulation</p>
        </article>
      </div>

      <ChartCard
        title="Annual temperature anomaly"
        subtitle={`${data.modelLabel} downscaled simulation for ${location.name}, 1950–2050`}
        badge={<DataBadge status="modelled" label="Climate model" />}
        className="span-2"
        height={300}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="anomalyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2FB37A" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#2FB37A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
              interval={11}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}°`}
            />
            <Tooltip content={<AnomalyTooltip />} />
            <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="anomaly"
              name="Anomaly"
              stroke="#2FB37A"
              strokeWidth={2.2}
              fill="url(#anomalyFill)"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Decadal average rainfall"
        subtitle="Modelled annual precipitation, averaged by decade"
        badge={<DataBadge status="modelled" />}
        height={260}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.decadal} margin={{ top: 12, right: 6, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
              width={46}
            />
            <Tooltip content={<DecadeTooltip />} />
            <Bar dataKey="precip" name="Rainfall" fill="#5BA7D9" radius={[4, 4, 0, 0]} barSize={14} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="card climate-note-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">How to read this chart</h2>
            <p className="card-subtitle">A projection is not a forecast</p>
          </div>
          <Globe2 size={19} aria-hidden="true" />
        </div>
        <ul className="bullet-list">
          {data.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="climate-source">
          Source:{' '}
          <a href={data.source.url} target="_blank" rel="noreferrer noopener">
            {data.source.name}
          </a>{' '}
          · {data.source.basis}
        </p>
      </section>
    </>
  );
}

export default function Climate() {
  const { data, loading, error, refresh } = useApi('/content/climate');

  if (loading && !data) {
    return (
      <div className="page">
        <PageHeader eyebrow="Climate awareness" title="Climate change" description="Loading climate content…" />
        <PageLoader label="Loading climate content…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Climate awareness" title="Climate change" />
        <ErrorState title="Could not load the climate module" error={error} onRetry={refresh} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Climate awareness"
        title={data.title}
        description={data.subtitle}
        meta={
          <>
            <DataBadge status="modelled" label="Projection + explainers" />
            <span className="meta-item">Updated {data.updated}</span>
          </>
        }
      />

      <ProjectionSection />

      <section className="fact-grid">
        {data.keyFacts.map((fact) => (
          <article className="card fact-card" key={fact.label}>
            <strong>{fact.value}</strong>
            <span className="fact-label">{fact.label}</span>
            <p>{fact.detail}</p>
            <small>{fact.source}</small>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Impacts</h2>
            <p className="card-subtitle">What a warming climate means in practice</p>
          </div>
          <Thermometer size={19} aria-hidden="true" />
        </div>
        <div className="impact-grid">
          {data.impacts.map((impact) => (
            <article className="impact-card" key={impact.title}>
              <span className="impact-icon" aria-hidden="true">
                <IconFor name={impact.icon} size={19} />
              </span>
              <h3>{impact.title}</h3>
              <p>{impact.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Why India matters in this story</h2>
            <p className="card-subtitle">Exposure, vulnerability and the monsoon</p>
          </div>
          <Globe2 size={19} aria-hidden="true" />
        </div>
        <ul className="bullet-list">
          {data.indiaContext.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="two-col-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Mitigation</h2>
              <p className="card-subtitle">Reduce the causes</p>
            </div>
            <Leaf size={18} aria-hidden="true" />
          </div>
          <div className="action-list">
            {data.mitigation.map((item) => (
              <div className="action-row" key={item.title}>
                <span className="action-icon" aria-hidden="true">
                  <IconFor name={item.icon} size={16} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Adaptation</h2>
              <p className="card-subtitle">Prepare for what is already locked in</p>
            </div>
            <Wind size={18} aria-hidden="true" />
          </div>
          <div className="action-list">
            {data.adaptation.map((item) => (
              <div className="action-row" key={item.title}>
                <span className="action-icon" aria-hidden="true">
                  <IconFor name={item.icon} size={16} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SourceNote
        className="page-source-note"
        sources={data.references.map((reference) => ({ name: reference.label, url: reference.url }))}
      >
        {data.disclaimer}
      </SourceNote>
    </div>
  );
}
