import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Clock,
  MapPin,
  Minus,
  RefreshCw,
  Sparkles,
  Wind,
} from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';
import ChartCard from '../components/ChartCard.jsx';
import DataBadge from '../components/DataBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { Skeleton, SkeletonCard } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { api, locationParams } from '../lib/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import { formatDate, formatNumber, relativeTime } from '../lib/format.js';

const DAY_OPTIONS = [3, 7, 10, 14];

function SeriesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-title">
        {formatDate(label)} · {label?.slice(11, 16)}
      </span>
      {payload.map((item) => (
        <div className="chart-tooltip-row" key={item.dataKey}>
          <span className="chart-dot" style={{ background: item.color || item.stroke }} />
          <span>{item.name}</span>
          <strong>
            {formatNumber(item.value, 1)}
            {item.unit || ''}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ScatterTooltip({ active, payload, xLabel, yLabel }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-row">
        <span>{xLabel}</span>
        <strong>{formatNumber(point?.x, 1)}</strong>
      </div>
      <div className="chart-tooltip-row">
        <span>{yLabel}</span>
        <strong>{formatNumber(point?.y, 1)}</strong>
      </div>
    </div>
  );
}

function CorrelationCard({ item }) {
  const hasValue = item.r !== null;
  const tone = !hasValue
    ? 'unknown'
    : item.r < -0.2
      ? 'negative'
      : item.r > 0.2
        ? 'positive'
        : 'neutral';
  const Arrow =
    tone === 'negative' ? ArrowDownRight : tone === 'positive' ? ArrowUpRight : Minus;

  return (
    <article className={`correlation-card ${tone}`}>
      <div className="correlation-head">
        <span>
          {item.xLabel} <em>vs</em> {item.yLabel}
        </span>
        <span className={`correlation-strength ${tone}`}>
          <Arrow size={13} aria-hidden="true" />
          {item.strength}
        </span>
      </div>
      <div className="correlation-value">
        {hasValue ? `${item.r > 0 ? '+' : ''}${item.r}` : '—'}
        <span>r</span>
      </div>
      <div className="correlation-meter" aria-hidden="true">
        <span
          className={tone}
          style={{
            width: `${hasValue ? Math.max(4, Math.abs(item.r) * 50) : 0}%`,
            marginLeft: hasValue && item.r < 0 ? `${50 - Math.abs(item.r) * 50}%` : '50%',
          }}
        />
        <i />
      </div>
      <p>{item.note}</p>
      <small>{formatNumber(item.n, 0)} overlapping hourly samples</small>
    </article>
  );
}

function ScatterPanel({ title, subtitle, data, xLabel, yLabel, xUnit, yUnit }) {
  return (
    <div className="scatter-panel">
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <div className="scatter-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              unit={xUnit}
              tick={{ fontSize: 10, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              unit={yUnit}
              tick={{ fontSize: 10, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <ZAxis range={[22, 22]} />
            <Tooltip content={<ScatterTooltip xLabel={xLabel} yLabel={yLabel} />} />
            <Scatter data={data} fill="#2FB37A" fillOpacity={0.45} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Analyzer() {
  const { location } = useLocation();
  const [days, setDays] = useState(7);
  const path = `/analyzer?${locationParams(location)}&days=${days}`;
  const { data, loading, error, refresh } = useApi(path);

  const [insight, setInsight] = useState({ loading: false, data: null, error: null });

  async function askInsight() {
    setInsight({ loading: true, data: null, error: null });
    try {
      const response = await api.post('/ai/analyzer-insight', { location, days });
      setInsight({ loading: false, data: response, error: null });
    } catch (requestError) {
      setInsight({ loading: false, data: null, error: requestError });
    }
  }

  if (loading && !data) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Weather–pollution analyzer"
          title={`Weather and pollution in ${location.name}`}
          description="Calculating correlations over the past week…"
        />
        <div className="detail-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} height={120} lines={1} />
          ))}
        </div>
        <div className="two-col-grid">
          <SkeletonCard height={320} lines={3} />
          <SkeletonCard height={320} lines={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Weather–pollution analyzer" title="Analyzer" />
        <ErrorState title="Could not load the analysis" error={error} onRetry={refresh} />
      </div>
    );
  }

  const { summary, correlations, series, scatter, daily } = data;

  const chartData = series.filter((_, index) => index % 2 === 0).map((row) => ({
    time: row.time,
    pm25: row.pm25,
    pm10: row.pm10,
    wind: row.windSpeed,
    humidity: row.humidity,
  }));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Weather–pollution analyzer"
        title={`Weather and pollution in ${data.location?.name || location.name}`}
        description="Descriptive statistics over the recent past: how wind, humidity, temperature and rainfall moved alongside PM2.5, PM10 and ozone."
        meta={
          <>
            <span className="meta-item">
              <MapPin size={14} aria-hidden="true" />
              {data.location?.name}
            </span>
            <span className="meta-item">
              <Clock size={14} aria-hidden="true" />
              {data.meta?.window} · updated {relativeTime(data.meta?.fetchedAt)}
            </span>
            <DataBadge status="estimated" label="CAMS model data" />
          </>
        }
        actions={
          <button type="button" className="btn btn-outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <div className="analyzer-controls">
        <div className="segmented" role="group" aria-label="Analysis window">
          {DAY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={option === days ? 'is-active' : ''}
              onClick={() => setDays(option)}
            >
              {option} days
            </button>
          ))}
        </div>
        <span className="analyzer-sample">
          {formatNumber(data.totalHours, 0)} overlapping hourly observations
        </span>
      </div>

      <div className="detail-grid">
        <StatCard
          icon={Activity}
          label="Mean PM2.5"
          value={formatNumber(summary.pm25Mean, 1)}
          unit="µg/m³"
          hint={`Peak ${formatNumber(summary.pm25Max, 1)} µg/m³`}
        />
        <StatCard
          icon={Activity}
          label="Mean PM10"
          value={formatNumber(summary.pm10Mean, 1)}
          unit="µg/m³"
          hint={`Peak ${formatNumber(summary.pm10Max, 1)} µg/m³`}
        />
        <StatCard
          icon={Wind}
          label="Hours above PM2.5 guideline"
          value={formatNumber(summary.exceedanceHours, 0)}
          unit="h"
          hint={`${formatNumber(summary.exceedancePct, 0)}% of the window · CPCB 24h value 60 µg/m³`}
          tone={summary.exceedancePct > 40 ? 'warn' : 'default'}
        />
        <StatCard
          icon={Wind}
          label="Stagnant, humid hours"
          value={formatNumber(summary.calmHumidHours, 0)}
          unit="h"
          hint="Wind < 8 km/h and humidity > 70%"
        />
      </div>

      <section className="card analyzer-summary-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">What the window shows</h2>
            <p className="card-subtitle">A plain-language reading of the statistics</p>
          </div>
          <Sparkles size={18} aria-hidden="true" />
        </div>
        <p className="analyzer-pattern">{summary.dominantPattern}</p>
        <p className="analyzer-note">
          Correlation is not causation. These numbers describe how variables moved together during
          this specific window; they do not prove that one caused the other.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Correlation summary</h2>
            <p className="card-subtitle">Pearson's r over the selected window</p>
          </div>
          <DataBadge status="estimated" label="Descriptive" />
        </div>
        <div className="correlation-grid">
          {correlations.map((item) => (
            <CorrelationCard item={item} key={item.id} />
          ))}
        </div>
      </section>

      <ChartCard
        title="Pollution and wind over time"
        subtitle="PM2.5 and PM10 against wind speed, two-hourly points"
        badge={<DataBadge status="modelled" />}
        className="span-2"
        height={300}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => `${formatDate(value)} ${value.slice(11, 13)}h`}
              interval={Math.max(Math.floor(chartData.length / 7), 1)}
              tick={{ fontSize: 10, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="pm"
              tick={{ fontSize: 10, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
              width={46}
            />
            <YAxis
              yAxisId="wind"
              orientation="right"
              tick={{ fontSize: 10, fill: 'var(--text-soft)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<SeriesTooltip />} />
            <Line
              yAxisId="pm"
              type="monotone"
              dataKey="pm25"
              name="PM2.5"
              unit=" µg/m³"
              stroke="#2FB37A"
              strokeWidth={2.2}
              dot={false}
            />
            <Line
              yAxisId="pm"
              type="monotone"
              dataKey="pm10"
              name="PM10"
              unit=" µg/m³"
              stroke="#5BA7D9"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="wind"
              type="monotone"
              dataKey="wind"
              name="Wind"
              unit=" km/h"
              stroke="#E2A63B"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Scatter views</h2>
            <p className="card-subtitle">Each dot is one hour; look for a trend, not a guarantee</p>
          </div>
        </div>
        <div className="scatter-grid">
          <ScatterPanel
            title="Wind vs PM2.5"
            subtitle="Dispersion usually lowers concentrations"
            data={scatter.windVsPm25}
            xLabel="Wind speed"
            yLabel="PM2.5"
            xUnit=" km/h"
            yUnit=" µg/m³"
          />
          <ScatterPanel
            title="Humidity vs PM2.5"
            subtitle="Humid air can trap and grow particles"
            data={scatter.humidityVsPm25}
            xLabel="Humidity"
            yLabel="PM2.5"
            xUnit="%"
            yUnit=" µg/m³"
          />
          <ScatterPanel
            title="Temperature vs PM2.5"
            subtitle="Warmer hours often mix air more deeply"
            data={scatter.temperatureVsPm25}
            xLabel="Temperature"
            yLabel="PM2.5"
            xUnit=" °C"
            yUnit=" µg/m³"
          />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Daily averages</h2>
            <p className="card-subtitle">Pollution and weather summarised by day</p>
          </div>
        </div>
        <div className="analyzer-table" role="table" aria-label="Daily averages">
          <div className="analyzer-row analyzer-head" role="row">
            <span role="columnheader">Date</span>
            <span role="columnheader">PM2.5</span>
            <span role="columnheader">PM10</span>
            <span role="columnheader">Wind</span>
            <span role="columnheader">Temp</span>
            <span role="columnheader">Rain</span>
          </div>
          {daily.map((day) => (
            <div className="analyzer-row" role="row" key={day.date}>
              <span role="cell">{formatDate(day.date, { withYear: true })}</span>
              <span role="cell">{formatNumber(day.pm25, 1)} µg/m³</span>
              <span role="cell">{formatNumber(day.pm10, 1)} µg/m³</span>
              <span role="cell">{formatNumber(day.wind, 1)} km/h</span>
              <span role="cell">{formatNumber(day.temperature, 1)} °C</span>
              <span role="cell">{formatNumber(day.rain, 1)} mm</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card insight-card">
        <div className="card-head">
          <div>
            <span className="eyebrow-small">
              <Sparkles size={13} aria-hidden="true" />
              AI interpretation
            </span>
            <h2 className="card-title">What could explain this pattern?</h2>
          </div>
          {insight.data && (
            <DataBadge
              status={insight.data.mode === 'groq' ? 'live' : 'estimated'}
              label={insight.data.mode === 'groq' ? 'Groq AI' : 'Offline insight'}
            />
          )}
        </div>

        {insight.loading ? (
          <div className="ai-briefing-skeleton">
            <Skeleton width="100%" height={13} />
            <Skeleton width="92%" height={13} />
            <Skeleton width="80%" height={13} />
          </div>
        ) : insight.error ? (
          <p className="ai-briefing-text ai-briefing-error">
            The interpretation could not be generated right now. The analysis above is unaffected.
          </p>
        ) : insight.data ? (
          <>
            <p className="ai-briefing-text">{insight.data.insight}</p>
            {insight.data.notice && <p className="ai-briefing-notice">{insight.data.notice}</p>}
          </>
        ) : (
          <p className="ai-briefing-text">
            Ask the assistant to interpret these correlations in plain language. It uses the same
            numbers on this page and will not claim causation where none is proven.
          </p>
        )}

        <div className="ai-briefing-foot">
          <span>Grounded in the {days}-day analysis above.</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={askInsight}
            disabled={insight.loading}
          >
            <Sparkles size={14} />
            {insight.data ? 'Regenerate' : 'Interpret this'}
          </button>
        </div>
      </section>

      <div className="inline-warning">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>
          Air-quality inputs are CAMS model estimates, not CPCB station measurements. Meteorological
          inputs are past-day model reanalysis. Use this page for learning, not for compliance.
        </span>
      </div>

      <SourceNote
        className="page-source-note"
        sources={[
          { name: 'Open-Meteo weather history', url: 'https://open-meteo.com/en/docs' },
          { name: 'Open-Meteo Air Quality API', url: 'https://open-meteo.com/en/docs/air-quality-api' },
          { name: 'CPCB', url: 'https://cpcb.nic.in/' },
        ]}
      >
        {data.meta?.note}
      </SourceNote>
    </div>
  );
}
