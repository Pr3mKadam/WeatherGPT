import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
  HeartPulse,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wind,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';
import ChartCard from '../components/ChartCard.jsx';
import DataBadge from '../components/DataBadge.jsx';
import AqiGauge from '../components/AqiGauge.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { SkeletonCard } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { locationParams } from '../lib/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import { AQI_SCALE, POLLUTANT_ORDER, pollutantTone } from '../lib/aqi.js';
import {
  formatDate,
  formatNumber,
  formatTime,
  formatHourLabel,
  relativeTime,
} from '../lib/format.js';

const CHART = {
  green: '#2FB37A',
  blue: '#5BA7D9',
  amber: '#E2A63B',
};

function TrendTooltip({ active, payload, label }) {
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

function DailyAqiTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-title">{point?.label}</span>
      <div className="chart-tooltip-row">
        <span className="chart-dot" style={{ background: point?.color }} />
        <span>Daily max AQI</span>
        <strong>{formatNumber(point?.aqiMax, 0)}</strong>
      </div>
      <div className="chart-tooltip-sub">{point?.category} · estimated</div>
    </div>
  );
}

export default function AirPollution() {
  const { location } = useLocation();
  const path = `/air?${locationParams(location)}`;
  const { data, loading, error, refresh } = useApi(path);

  if (loading && !data) {
    return (
      <div className="page">
        <PageHeader eyebrow="Air pollution monitoring" title={`Air quality in ${location.name}`} description="Fetching the latest pollutant data…" />
        <div className="air-hero-skeleton">
          <SkeletonCard height={280} lines={4} />
          <SkeletonCard height={280} lines={4} />
        </div>
        <div className="pollutant-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} height={150} lines={2} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Air pollution monitoring" title="Air pollution" />
        <ErrorState title="Could not load air-quality data" error={error} onRetry={refresh} />
      </div>
    );
  }

  const { air, location: resolved, meta } = data;
  const current = air.current;
  const aqi = air.aqi;

  const pollutantMap = new Map((aqi?.subIndices || []).map((item) => [item.key, item]));
  const pollutantCards = POLLUTANT_ORDER.map((key) => pollutantMap.get(key)).filter(Boolean);

  const trendData = (air.hourly || []).map((hour) => ({
    time: hour.time,
    pm25: hour.pm25,
    pm10: hour.pm10,
    aqi: hour.aqi,
  }));

  const nowHour =
    air.hourly?.find((hour) => hour.time.slice(0, 13) === air.current?.time?.slice(0, 13))?.time ||
    null;

  const today = new Date().toISOString().slice(0, 10);
  const dailyAqi = (air.daily || [])
    .filter((day) => day.date >= today)
    .slice(0, 6)
    .map((day) => ({
      label: day.date === today ? 'Today' : formatDate(day.date),
      aqiMax: day.aqiMax,
      category: day.category,
      color: AQI_SCALE.find((category) => category.key === day.categoryKey)?.color || CHART.amber,
    }));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Air pollution monitoring"
        title={`Air quality in ${resolved.name}`}
        description="A CPCB-style AQI calculated from CAMS model concentrations, with the pollutant breakdown and health context behind the number."
        meta={
          <>
            <span className="meta-item">
              <MapPin size={14} aria-hidden="true" />
              {[resolved.name, resolved.admin1, resolved.country].filter(Boolean).join(', ')}
            </span>
            <span className="meta-item">
              <Clock size={14} aria-hidden="true" />
              {formatTime(current.time)} local · updated {relativeTime(meta?.fetchedAt)}
            </span>
            <DataBadge
              status="estimated"
              label="CPCB-style estimate"
              title="Calculated with CPCB breakpoints from hourly CAMS model values. Official CPCB AQI uses 24-hour averages and station measurements."
            />
          </>
        }
        actions={
          <button type="button" className="btn btn-outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {!aqi ? (
        <div className="card">
          <div className="card-empty">
            <Wind size={26} aria-hidden="true" />
            <h3>Air-quality data is unavailable</h3>
            <p>
              The CAMS model feed did not return pollutant concentrations for this location. Try
              refreshing in a few minutes.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="card air-hero-card">
            <div className="air-hero-gauge">
              <AqiGauge
                value={aqi.value}
                category={aqi.category}
                color={aqi.color}
                size={260}
                label="CPCB-style AQI"
              />
            </div>

            <div className="air-hero-copy">
              <span className="eyebrow-small">Air quality index</span>
              <h2>{aqi.category} air quality</h2>
              <p className="air-hero-health">{aqi.health}</p>

              <div className="air-hero-meta">
                <div>
                  <span>Dominant pollutant</span>
                  <strong>
                    {aqi.dominantLabel}
                    <em>
                      {formatNumber(aqi.dominantConcentration, 1)} {aqi.dominantUnit}
                    </em>
                  </strong>
                </div>
                <div>
                  <span>PM2.5</span>
                  <strong>
                    {formatNumber(current.pm25, 1)}
                    <em>µg/m³</em>
                  </strong>
                </div>
                <div>
                  <span>PM10</span>
                  <strong>
                    {formatNumber(current.pm10, 1)}
                    <em>µg/m³</em>
                  </strong>
                </div>
                <div>
                  <span>Ozone</span>
                  <strong>
                    {formatNumber(current.o3, 1)}
                    <em>µg/m³</em>
                  </strong>
                </div>
              </div>

              <div className="air-hero-foot">
                <span className="air-standard">
                  <ShieldCheck size={14} aria-hidden="true" />
                  Standard: {air.standard?.name}
                </span>
                <a
                  className="text-link"
                  href={air.standard?.reference}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  CPCB reference <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </section>

          <div className="aqi-scale" role="img" aria-label={`Current AQI ${aqi.value}, category ${aqi.category}`}>
            {AQI_SCALE.map((category) => (
              <div
                key={category.key}
                className={`aqi-scale-item ${aqi.categoryKey === category.key ? 'is-active' : ''}`.trim()}
                style={{ '--scale-color': category.color }}
              >
                <span className="aqi-scale-swatch" />
                <strong>{category.label}</strong>
                <small>{category.range}</small>
              </div>
            ))}
          </div>

          <div className="pollutant-grid">
            {pollutantCards.map((item) => {
              const tone = pollutantTone(item.concentration, item.standard);
              const width = Math.min(100, (item.concentration / item.standard) * 50);
              return (
                <article className="card pollutant-card" key={item.key}>
                  <div className="pollutant-card-head">
                    <span className="pollutant-card-label">{item.label}</span>
                    <span className={`pollutant-pill ${tone}`}>{tone === 'good' ? 'Within limit' : tone === 'warn' ? 'Above limit' : 'Well above'}</span>
                  </div>
                  <div className="pollutant-card-value">
                    {formatNumber(item.concentration, item.key === 'co' ? 2 : 1)}
                    <span>{item.unit}</span>
                  </div>
                  <div className="pollutant-card-track">
                    <span className={`pollutant-fill ${tone}`} style={{ width: `${Math.max(4, width)}%` }} />
                    <span className="pollutant-standard-mark" title="CPCB standard" />
                  </div>
                  <div className="pollutant-card-foot">
                    <span>CPCB {item.standard} {item.unit}</span>
                    <span>Sub-index {item.subIndex}</span>
                  </div>
                  <p className="pollutant-card-note">{item.averaging}</p>
                </article>
              );
            })}
          </div>

          <ChartCard
            title="Particulate matter trend"
            subtitle="Hourly PM2.5 and PM10 — two days of history plus the forecast"
            badge={<DataBadge status="modelled" label="CAMS model" />}
            className="span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 12, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(value) => `${formatDate(value)} ${value.slice(11, 13)}h`}
                  interval={23}
                  tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                  axisLine={false}
                  tickLine={false}
                  width={46}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<TrendTooltip />} />
                <ReferenceLine
                  y={60}
                  stroke={CHART.amber}
                  strokeDasharray="5 5"
                  label={{ value: 'PM2.5 24h limit', position: 'insideTopRight', fill: 'var(--text-soft)', fontSize: 10 }}
                />
                <ReferenceLine
                  y={100}
                  stroke={CHART.blue}
                  strokeDasharray="5 5"
                  label={{ value: 'PM10 24h limit', position: 'insideTopRight', fill: 'var(--text-soft)', fontSize: 10 }}
                />
                {nowHour && (
                  <ReferenceLine
                    x={nowHour}
                    stroke="var(--border-strong)"
                    label={{ value: 'now', position: 'top', fill: 'var(--text-soft)', fontSize: 10 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="pm25"
                  name="PM2.5"
                  unit=" µg/m³"
                  stroke={CHART.green}
                  strokeWidth={2.2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="pm10"
                  name="PM10"
                  unit=" µg/m³"
                  stroke={CHART.blue}
                  strokeWidth={2.2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="two-col-grid">
            <ChartCard
              title="Daily maximum AQI"
              subtitle="Estimated CPCB-style index, today onward"
              badge={<DataBadge status="estimated" />}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyAqi} margin={{ top: 12, right: 6, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip content={<DailyAqiTooltip />} />
                  <Bar dataKey="aqiMax" radius={[5, 5, 0, 0]} barSize={26}>
                    {dailyAqi.map((day) => (
                      <Cell key={day.label} fill={day.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <section className="card health-card">
              <div className="card-head">
                <div>
                  <h2 className="card-title">What this means for health</h2>
                  <p className="card-subtitle">General awareness guidance, not medical advice</p>
                </div>
                <HeartPulse size={20} aria-hidden="true" />
              </div>
              <div className="health-block">
                <span className="health-label">Everyone</span>
                <p>{aqi.health}</p>
              </div>
              <div className="health-block">
                <span className="health-label">Sensitive groups</span>
                <p>{aqi.sensitive}</p>
              </div>
              <div className="health-block">
                <span className="health-label">Environment</span>
                <p>{aqi.environment}</p>
              </div>
              <div className="health-note">
                <AlertTriangle size={15} aria-hidden="true" />
                <span>
                  If you have asthma, heart disease or another chronic condition, follow your
                  doctor’s advice and local health advisories.
                </span>
              </div>
            </section>
          </div>

          <section className="card explainer-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">How this AQI is calculated</h2>
                <p className="card-subtitle">One standard, stated clearly</p>
              </div>
              <Info size={19} aria-hidden="true" />
            </div>

            <div className="explainer-grid">
              <div>
                <h3>1. Pollutant sub-indices</h3>
                <p>
                  Each pollutant concentration is mapped to a 0–500 sub-index using the CPCB
                  breakpoint table. PM2.5, PM10, NO₂ and SO₂ use 24-hour breakpoints; CO and O₃ use
                  8-hour breakpoints.
                </p>
              </div>
              <div>
                <h3>2. The worst pollutant wins</h3>
                <p>
                  The overall AQI is the highest sub-index. The pollutant responsible is shown as
                  the “dominant pollutant”, because that is the one driving the category.
                </p>
              </div>
              <div>
                <h3>3. What is different here</h3>
                <p>
                  WeatherGPT applies CPCB breakpoints to hourly CAMS model concentrations. Official
                  CPCB AQI uses station measurements and longer averaging periods, so this is an
                  estimate — useful for awareness, not compliance.
                </p>
              </div>
            </div>

            <div className="explainer-table" role="table" aria-label="CPCB AQI categories">
              <div className="explainer-row explainer-head" role="row">
                <span role="columnheader">Category</span>
                <span role="columnheader">AQI range</span>
                <span role="columnheader">What it generally means</span>
              </div>
              {AQI_SCALE.map((category) => (
                <div className="explainer-row" role="row" key={category.key}>
                  <span role="cell">
                    <span className="explainer-dot" style={{ background: category.color }} />
                    {category.label}
                  </span>
                  <span role="cell">{category.range}</span>
                  <span role="cell">
                    {category.key === 'good' && 'Minimal impact for most people.'}
                    {category.key === 'satisfactory' && 'Minor discomfort possible for very sensitive people.'}
                    {category.key === 'moderate' && 'Breathing discomfort for people with asthma or heart conditions.'}
                    {category.key === 'poor' && 'Breathing discomfort for many; avoid prolonged exertion.'}
                    {category.key === 'very-poor' && 'Respiratory illness possible; stay indoors where possible.'}
                    {category.key === 'severe' && 'Serious health effects; follow official advisories.'}
                  </span>
                </div>
              ))}
            </div>

            <SourceNote
              sources={[
                { name: 'CPCB National AQI', url: 'https://cpcb.nic.in/national-air-quality-index/' },
                { name: 'Open-Meteo Air Quality docs', url: 'https://open-meteo.com/en/docs/air-quality-api' },
              ]}
            >
              Open-Meteo’s Air Quality API also returns a US AQI value. WeatherGPT deliberately
              does not display it alongside the CPCB-style index, because mixing AQI standards
              produces misleading comparisons.
            </SourceNote>
          </section>

          <div className="air-footnote">
            <span>
              Data status: <strong>estimated</strong> from CAMS model concentrations.
            </span>
            <Link to="/app/analyzer" className="text-link">
              See how weather drives these pollutants <ArrowRight size={13} />
            </Link>
          </div>
        </>
      )}

      <SourceNote
        className="page-source-note"
        sources={[
          { name: 'Open-Meteo / CAMS', url: 'https://open-meteo.com/en/docs/air-quality-api' },
          { name: 'CPCB', url: 'https://cpcb.nic.in/' },
        ]}
      >
        Pollutant concentrations are modelled by CAMS, not measured at a CPCB station. The AQI is
        a CPCB-style estimate and must not be presented as an official CPCB value.
      </SourceNote>
    </div>
  );
}
