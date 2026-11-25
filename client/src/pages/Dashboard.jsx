import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Droplets,
  Gauge,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sun,
  Wind,
  Activity,
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
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';
import ChartCard from '../components/ChartCard.jsx';
import DataBadge from '../components/DataBadge.jsx';
import WeatherIcon from '../components/WeatherIcon.jsx';
import AqiGauge from '../components/AqiGauge.jsx';
import RiskGauge from '../components/RiskGauge.jsx';
import ForecastStrip from '../components/ForecastStrip.jsx';
import PollutantBars from '../components/PollutantBars.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { Skeleton } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { api, locationParams } from '../lib/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import {
  formatNumber,
  formatTemp,
  formatTime,
  formatHourLabel,
  relativeTime,
} from '../lib/format.js';

const CHART = {
  green: '#2FB37A',
  blue: '#5BA7D9',
  amber: '#E2A63B',
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-title">{formatHourLabel(label)}</span>
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

function DashboardSkeleton() {
  return (
    <div className="dashboard-grid" aria-hidden="true">
      <div className="card span-2 skeleton-card" style={{ minHeight: 280 }}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="45%" height={54} />
        <Skeleton width="70%" height={14} />
        <Skeleton width="90%" height={48} />
      </div>
      <div className="card skeleton-card" style={{ minHeight: 280 }}>
        <Skeleton width="50%" height={12} />
        <Skeleton width="100%" height={140} />
        <Skeleton width="70%" height={12} />
      </div>
      <div className="card skeleton-card" style={{ minHeight: 280 }}>
        <Skeleton width="50%" height={12} />
        <Skeleton width="100%" height={140} />
        <Skeleton width="70%" height={12} />
      </div>
      <div className="card span-2 skeleton-card" style={{ minHeight: 320 }}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="100%" height={220} />
      </div>
      <div className="card span-2 skeleton-card" style={{ minHeight: 320 }}>
        <Skeleton width="30%" height={12} />
        <Skeleton width="100%" height={90} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { location } = useLocation();
  const path = `/environment?${locationParams(location)}`;
  const { data, loading, error, refresh } = useApi(path);

  const [briefing, setBriefing] = useState({ loading: true, data: null, error: null });

  const fetchedAt = data?.meta?.fetchedAt;

  useEffect(() => {
    if (!data) return undefined;
    let cancelled = false;
    setBriefing({ loading: true, data: null, error: null });

    api
      .post('/ai/briefing', { location })
      .then((response) => {
        if (!cancelled) setBriefing({ loading: false, data: response, error: null });
      })
      .catch((requestError) => {
        if (!cancelled) setBriefing({ loading: false, data: null, error: requestError });
      });

    return () => {
      cancelled = true;
    };
  }, [fetchedAt, location]);

  if (loading && !data) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Live environmental overview"
          title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}`}
          description={`Fetching the latest conditions for ${location.name}…`}
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Live environmental overview" title="Dashboard" />
        <ErrorState
          title="Could not load the dashboard"
          error={error}
          onRetry={refresh}
        />
      </div>
    );
  }

  const { weather, air, alerts = [], risk, meta } = data;
  const current = weather.current;
  const today = weather.daily?.[0];
  const aqi = air?.aqi;
  const topAlert = alerts[0];

  const chartData = (weather.hourly || []).slice(0, 24).map((hour) => ({
    time: hour.time,
    temperature: hour.temperature,
    precipitation: hour.precipitation,
  }));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Live environmental overview"
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${location.name}`}
        description="A joined-up view of weather, air quality and environmental risk — with every number labelled by how it was produced."
        meta={
          <>
            <span className="meta-item">
              <MapPin size={14} aria-hidden="true" />
              {[location.name, location.admin1, location.country].filter(Boolean).join(', ')}
            </span>
            <span className="meta-item">
              <Clock size={14} aria-hidden="true" />
              Updated {relativeTime(meta?.fetchedAt)}
            </span>
            <DataBadge status="live" label="Fetched on load" title="Data is fetched from the WeatherGPT API each time this page loads or refreshes." />
          </>
        }
        actions={
          <button type="button" className="btn btn-outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {meta?.warnings?.length > 0 && (
        <div className="inline-warning">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{meta.warnings.join(' ')}</span>
        </div>
      )}

      {topAlert && (
        <div className={`dashboard-alert severity-${topAlert.severity}`}>
          <span className="dashboard-alert-icon" aria-hidden="true">
            <AlertTriangle size={19} />
          </span>
          <div className="dashboard-alert-copy">
            <strong>
              {topAlert.severityLabel} · {topAlert.title}
            </strong>
            <p>{topAlert.reason}</p>
          </div>
          <Link to="/app/risk" className="dashboard-alert-link">
            All {alerts.length} advisor{alerts.length === 1 ? 'y' : 'ies'}
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="card weather-hero">
          <div className="weather-hero-top">
            <div>
              <span className="weather-hero-eyebrow">
                <MapPin size={13} aria-hidden="true" />
                {location.name}
                {location.admin1 ? `, ${location.admin1}` : ''}
              </span>
              <div className="weather-hero-temp">
                {formatTemp(current.temperature)}
                <span className="weather-hero-unit">C</span>
              </div>
              <p className="weather-hero-condition">
                {current.condition?.label || 'Conditions unavailable'}
                {current.apparentTemperature !== null && (
                  <span> · feels like {formatTemp(current.apparentTemperature)}</span>
                )}
              </p>
            </div>
            <span className="weather-hero-icon" aria-hidden="true">
              <WeatherIcon group={current.condition?.group} isDay={current.isDay} size={64} />
            </span>
          </div>

          <div className="weather-hero-stats">
            <div>
              <Droplets size={15} aria-hidden="true" />
              <span>Humidity</span>
              <strong>{formatNumber(current.humidity, 0)}%</strong>
            </div>
            <div>
              <Wind size={15} aria-hidden="true" />
              <span>Wind</span>
              <strong>
                {formatNumber(current.windSpeed, 0)} <em>km/h</em>
              </strong>
            </div>
            <div>
              <Droplets size={15} aria-hidden="true" />
              <span>Rain today</span>
              <strong>
                {formatNumber(today?.precipitationSum, 1)} <em>mm</em>
              </strong>
            </div>
            <div>
              <Sun size={15} aria-hidden="true" />
              <span>UV max</span>
              <strong>{formatNumber(today?.uvMax, 1)}</strong>
            </div>
          </div>

          <div className="weather-hero-foot">
            <DataBadge status="forecast" label="Model forecast" />
            <span>
              {formatTime(current.time)} local · {formatNumber(today?.tempMin, 0)}° /{' '}
              {formatNumber(today?.tempMax, 0)}°
            </span>
          </div>
        </section>

        <section className="card aqi-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Air quality</h2>
              <p className="card-subtitle">CPCB-style estimate</p>
            </div>
            <DataBadge
              status="estimated"
              title="Calculated from Open-Meteo/CAMS model concentrations using CPCB breakpoints. Not an official CPCB station reading."
            />
          </div>

          {aqi ? (
            <>
              <AqiGauge value={aqi.value} category={aqi.category} color={aqi.color} size={220} />
              <div className="aqi-dominant">
                <span>Dominant pollutant</span>
                <strong>
                  {aqi.dominantLabel}{' '}
                  <em>
                    {formatNumber(aqi.dominantConcentration, 1)} {aqi.dominantUnit}
                  </em>
                </strong>
              </div>
              <div className="aqi-mini-grid">
                <div>
                  <span>PM2.5</span>
                  <strong>{formatNumber(air.current?.pm25, 1)}</strong>
                  <em>µg/m³</em>
                </div>
                <div>
                  <span>PM10</span>
                  <strong>{formatNumber(air.current?.pm10, 1)}</strong>
                  <em>µg/m³</em>
                </div>
              </div>
              <Link to="/app/air" className="card-link">
                Open air pollution
                <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <div className="card-empty">
              <Wind size={22} aria-hidden="true" />
              <p>Air-quality data is unavailable right now.</p>
            </div>
          )}
        </section>

        <section className="card risk-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Environmental risk</h2>
              <p className="card-subtitle">Composite indicator</p>
            </div>
            <DataBadge status="estimated" label="Heuristic" title="A transparent weighted score for awareness, not an official risk rating." />
          </div>

          <RiskGauge value={risk.score} level={risk.level} color={risk.color} size={210} />

          <p className="risk-summary">{risk.summary}</p>

          <div className="risk-driver">
            <span>Largest driver</span>
            <strong>{risk.drivers?.[0]?.label || 'No dominant factor'}</strong>
            <em>{risk.drivers?.[0]?.detail || 'Conditions are broadly balanced.'}</em>
          </div>

          <Link to="/app/risk" className="card-link">
            View risk intelligence
            <ArrowRight size={14} />
          </Link>
        </section>

        <ChartCard
          className="span-2"
          title="Next 24 hours"
          subtitle="Temperature and rainfall from the hourly forecast"
          badge={<DataBadge status="forecast" />}
          actions={
            <Link to="/app/weather" className="text-link">
              Full forecast <ArrowRight size={13} />
            </Link>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.green} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatHourLabel}
                interval={3}
                tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="temp"
                tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(value) => `${value}°`}
              />
              <YAxis
                yAxisId="rain"
                orientation="right"
                tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                unit="°C"
                stroke={CHART.green}
                strokeWidth={2.4}
                fill="url(#tempFill)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Bar
                yAxisId="rain"
                dataKey="precipitation"
                name="Rain"
                unit=" mm"
                fill={CHART.blue}
                opacity={0.55}
                barSize={7}
                radius={[3, 3, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="card forecast-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">7-day outlook</h2>
              <p className="card-subtitle">Daily maximum and minimum</p>
            </div>
            <DataBadge status="forecast" />
          </div>
          <ForecastStrip daily={weather.daily} days={7} />
          <SourceNote>
            Daily values are Open-Meteo model forecasts. Rain percentage is the chance of
            precipitation, not the expected amount.
          </SourceNote>
        </section>

        <section className="card pollutants-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Pollutant snapshot</h2>
              <p className="card-subtitle">Against CPCB 24-hour standards</p>
            </div>
          </div>
          {aqi?.subIndices?.length ? (
            <PollutantBars items={aqi.subIndices.slice(0, 4)} compact />
          ) : (
            <div className="card-empty">
              <Wind size={22} aria-hidden="true" />
              <p>Pollutant data is unavailable.</p>
            </div>
          )}
          <Link to="/app/air" className="card-link">
            All pollutants and trends
            <ArrowRight size={14} />
          </Link>
        </section>

        <section className="card ai-briefing-card">
          <div className="card-head">
            <div>
              <span className="eyebrow-small">
                <Sparkles size={13} aria-hidden="true" />
                AI briefing
              </span>
              <h2 className="card-title">Today in plain language</h2>
            </div>
            {briefing.data && (
              <DataBadge
                status={briefing.data.mode === 'groq' ? 'live' : 'estimated'}
                label={briefing.data.mode === 'groq' ? 'Groq AI' : 'Offline insight'}
              />
            )}
          </div>

          {briefing.loading ? (
            <div className="ai-briefing-skeleton">
              <Skeleton width="100%" height={13} />
              <Skeleton width="92%" height={13} />
              <Skeleton width="76%" height={13} />
            </div>
          ) : briefing.error ? (
            <p className="ai-briefing-text ai-briefing-error">
              The briefing could not be generated right now. The live numbers above are still
              accurate.
            </p>
          ) : (
            <p className="ai-briefing-text">{briefing.data?.briefing}</p>
          )}

          {briefing.data?.notice && <p className="ai-briefing-notice">{briefing.data.notice}</p>}

          <div className="ai-briefing-foot">
            <span>Grounded in the live data on this page.</span>
            <Link to="/app/assistant" className="text-link">
              Ask a follow-up <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        <section className="card tip-card">
          <span className="tip-icon" aria-hidden="true">
            <Gauge size={20} />
          </span>
          <h2>One thing you can do today</h2>
          <p>
            Check the hourly AQI before a long walk or run. Shifting outdoor exercise to a cleaner
            hour is a simple way to cut your exposure.
          </p>
          <Link to="/app/sustainability" className="card-link">
            More everyday actions
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>

      <SourceNote
        className="page-source-note"
        sources={[
          { name: 'Open-Meteo', url: 'https://open-meteo.com/' },
          { name: 'CAMS air quality', url: 'https://open-meteo.com/en/docs/air-quality-api' },
          { name: 'CPCB AQI', url: 'https://cpcb.nic.in/national-air-quality-index/' },
        ]}
      >
        Weather is an Open-Meteo model forecast. Air quality comes from CAMS model concentrations,
        and the AQI is a CPCB-style estimate — not an official CPCB reading. Advisories are
        computed for awareness and are not official IMD warnings.
      </SourceNote>
    </div>
  );
}
