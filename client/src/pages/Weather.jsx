import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cloud,
  Compass,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  RefreshCw,
  Sunrise,
  Sunset,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';
import ChartCard from '../components/ChartCard.jsx';
import DataBadge from '../components/DataBadge.jsx';
import WeatherIcon from '../components/WeatherIcon.jsx';
import ForecastStrip from '../components/ForecastStrip.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import StatCard from '../components/StatCard.jsx';
import { SkeletonCard } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { locationParams } from '../lib/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import {
  dayLabel,
  formatHourLabel,
  formatNumber,
  formatTemp,
  formatTime,
  relativeTime,
} from '../lib/format.js';

const CHART = {
  green: '#2FB37A',
  blue: '#5BA7D9',
  amber: '#E2A63B',
  teal: '#2A9D8F',
};

function WeatherTooltip({ active, payload, label }) {
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

function DailyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-title">{label}</span>
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

export default function Weather() {
  const { location } = useLocation();
  const path = `/weather?${locationParams(location)}`;
  const { data, loading, error, refresh } = useApi(path);

  if (loading && !data) {
    return (
      <div className="page">
        <PageHeader eyebrow="Weather monitoring" title={`Weather in ${location.name}`} description="Fetching the latest forecast…" />
        <div className="detail-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} height={120} lines={1} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Weather monitoring" title="Weather" />
        <ErrorState title="Could not load the weather forecast" error={error} onRetry={refresh} />
      </div>
    );
  }

  const { weather, location: resolved, meta } = data;
  const current = weather.current;
  const today = weather.daily?.[0];

  const hourly = (weather.hourly || []).slice(0, 48).map((hour) => ({
    time: hour.time,
    temperature: hour.temperature,
    precipitation: hour.precipitation,
    probability: hour.precipitationProbability,
    humidity: hour.humidity,
    wind: hour.windSpeed,
  }));

  const weekMin = Math.min(...weather.daily.map((day) => day.tempMin));
  const weekMax = Math.max(...weather.daily.map((day) => day.tempMax));
  const weekRange = Math.max(weekMax - weekMin, 1);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Weather monitoring"
        title={`Weather in ${resolved.name}`}
        description="Current conditions, 48 hours of hourly detail and a 7-day outlook — all from the Open-Meteo forecast model."
        meta={
          <>
            <span className="meta-item">
              <MapPin size={14} aria-hidden="true" />
              {[resolved.name, resolved.admin1, resolved.country].filter(Boolean).join(', ')}
            </span>
            <span className="meta-item">
              Updated {relativeTime(meta?.fetchedAt)} · {weather.timezone}
            </span>
            <DataBadge status="forecast" />
          </>
        }
        actions={
          <button type="button" className="btn btn-outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <section className="card current-weather-card">
        <div className="current-main">
          <span className="weather-hero-eyebrow">
            <MapPin size={13} aria-hidden="true" />
            Right now · {formatTime(current.time)} local
          </span>
          <div className="current-temp">
            {formatTemp(current.temperature)}
            <span className="current-unit">C</span>
          </div>
          <p className="current-condition">
            {current.condition?.label}
            <span> · feels like {formatTemp(current.apparentTemperature)}</span>
          </p>
          <div className="current-substats">
            <span>
              <Droplets size={14} aria-hidden="true" /> {formatNumber(current.humidity, 0)}% humidity
            </span>
            <span>
              <Wind size={14} aria-hidden="true" /> {formatNumber(current.windSpeed, 0)} km/h{' '}
              {current.windDirectionLabel}
            </span>
            <span>
              <Cloud size={14} aria-hidden="true" /> {formatNumber(current.cloudCover, 0)}% cloud
            </span>
          </div>
        </div>

        <div className="current-visual" aria-hidden="true">
          <span className="current-icon-wrap">
            <WeatherIcon group={current.condition?.group} isDay={current.isDay} size={92} />
          </span>
          <span className="current-today-range">
            {formatTemp(today?.tempMin)} <span>/</span> {formatTemp(today?.tempMax)}
          </span>
        </div>

        <div className="current-side">
          <div>
            <span>Sunrise</span>
            <strong>
              <Sunrise size={16} aria-hidden="true" /> {formatTime(today?.sunrise)}
            </strong>
          </div>
          <div>
            <span>Sunset</span>
            <strong>
              <Sunset size={16} aria-hidden="true" /> {formatTime(today?.sunset)}
            </strong>
          </div>
          <div>
            <span>Daylight</span>
            <strong>
              <Sun size={16} aria-hidden="true" />{' '}
              {today?.daylightSeconds ? `${(today.daylightSeconds / 3600).toFixed(1)} h` : '—'}
            </strong>
          </div>
          <div>
            <span>Pressure</span>
            <strong>
              <Gauge size={16} aria-hidden="true" /> {formatNumber(current.pressure, 0)} hPa
            </strong>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <StatCard
          icon={Droplets}
          label="Humidity"
          value={formatNumber(current.humidity, 0)}
          unit="%"
          hint={current.humidity >= 70 ? 'Humid — may feel warmer' : 'Comfortable range'}
        />
        <StatCard
          icon={Wind}
          label="Wind speed"
          value={formatNumber(current.windSpeed, 0)}
          unit="km/h"
          hint={`From ${current.windDirectionLabel || '—'}${current.windGust ? ` · gusts ${formatNumber(current.windGust, 0)} km/h` : ''}`}
        />
        <StatCard
          icon={Thermometer}
          label="Feels like"
          value={formatTemp(current.apparentTemperature)}
          hint="Apparent temperature"
        />
        <StatCard
          icon={Droplets}
          label="Rain today"
          value={formatNumber(today?.precipitationSum, 1)}
          unit="mm"
          hint={`${formatNumber(today?.precipitationProbabilityMax, 0)}% max chance`}
        />
        <StatCard
          icon={Sun}
          label="UV index (max)"
          value={formatNumber(today?.uvMax, 1)}
          hint={
            today?.uvMax >= 8
              ? 'Very high — protect skin'
              : today?.uvMax >= 6
                ? 'High — use sunscreen'
                : 'Moderate or lower'
          }
          tone={today?.uvMax >= 8 ? 'warn' : 'default'}
        />
        <StatCard
          icon={Cloud}
          label="Cloud cover"
          value={formatNumber(current.cloudCover, 0)}
          unit="%"
          hint={current.condition?.label}
        />
        <StatCard
          icon={Compass}
          label="Wind direction"
          value={current.windDirectionLabel || '—'}
          unit={current.windDirection !== null ? `${formatNumber(current.windDirection, 0)}°` : ''}
          hint="Direction the wind comes from"
        />
        <StatCard
          icon={Eye}
          label="Pressure"
          value={formatNumber(current.pressure, 0)}
          unit="hPa"
          hint="Mean sea-level pressure"
        />
      </div>

      <div className="two-col-grid">
        <ChartCard
          title="Next 48 hours"
          subtitle="Temperature and hourly rainfall"
          badge={<DataBadge status="forecast" />}
          className="span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourly} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="weatherTempFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.green} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatHourLabel}
                interval={5}
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
              <Tooltip content={<WeatherTooltip />} />
              <Area
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                unit="°C"
                stroke={CHART.green}
                strokeWidth={2.4}
                fill="url(#weatherTempFill)"
                dot={false}
              />
              <Bar
                yAxisId="rain"
                dataKey="precipitation"
                name="Rain"
                unit=" mm"
                fill={CHART.blue}
                opacity={0.6}
                barSize={6}
                radius={[3, 3, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Humidity & wind"
          subtitle="How sticky and breezy the next 48 hours will feel"
          badge={<DataBadge status="forecast" />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourly} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="time"
                tickFormatter={formatHourLabel}
                interval={7}
                tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="humidity"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                yAxisId="wind"
                orientation="right"
                tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<WeatherTooltip />} />
              <Line
                yAxisId="humidity"
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                unit="%"
                stroke={CHART.blue}
                strokeWidth={2.2}
                dot={false}
              />
              <Line
                yAxisId="wind"
                type="monotone"
                dataKey="wind"
                name="Wind"
                unit=" km/h"
                stroke={CHART.teal}
                strokeWidth={2.2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="two-col-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">7-day detail</h2>
              <p className="card-subtitle">Daily range, rain chance and conditions</p>
            </div>
            <DataBadge status="forecast" />
          </div>

          <div className="daily-list">
            {weather.daily.map((day, index) => {
              const left = ((day.tempMin - weekMin) / weekRange) * 100;
              const width = Math.max(((day.tempMax - day.tempMin) / weekRange) * 100, 4);
              return (
                <div className="daily-row" key={day.date}>
                  <span className="daily-name">
                    {dayLabel(day.date, index)}
                    <em>{day.date.slice(5).replace('-', '/')}</em>
                  </span>
                  <span className="daily-icon">
                    <WeatherIcon group={day.condition?.group} isDay size={22} />
                  </span>
                  <span className="daily-rain" title="Chance of precipitation">
                    <Droplets size={12} aria-hidden="true" />
                    {formatNumber(day.precipitationProbabilityMax, 0)}%
                  </span>
                  <span className="daily-min">{formatTemp(day.tempMin)}</span>
                  <span className="daily-range">
                    <span style={{ left: `${left}%`, width: `${width}%` }} />
                  </span>
                  <span className="daily-max">{formatTemp(day.tempMax)}</span>
                  <span className="daily-desc">{day.condition?.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <ChartCard
          title="Daily rainfall"
          subtitle="Expected total precipitation per day"
          badge={<DataBadge status="forecast" />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={weather.daily.map((day, index) => ({
                date: dayLabel(day.date, index),
                rain: day.precipitationSum,
              }))}
              margin={{ top: 10, right: 6, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-soft)' }}
                axisLine={false}
                tickLine={false}
                width={42}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<DailyTooltip />} />
              <Bar dataKey="rain" name="Rain" unit=" mm" fill={CHART.blue} radius={[5, 5, 0, 0]} barSize={26} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">7-day forecast at a glance</h2>
            <p className="card-subtitle">Maximum and minimum temperatures</p>
          </div>
        </div>
        <ForecastStrip daily={weather.daily} days={7} />
      </section>

      <SourceNote
        className="page-source-note"
        sources={[
          { name: 'Open-Meteo', url: 'https://open-meteo.com/' },
          { name: 'WMO weather codes', url: 'https://open-meteo.com/en/docs' },
        ]}
      >
        Forecast values are model-based and can differ from conditions at your exact location.
        Rainfall probability is the chance of precipitation, not the expected amount.
      </SourceNote>
    </div>
  );
}
