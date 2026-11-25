import { Droplet } from 'lucide-react';
import WeatherIcon from './WeatherIcon.jsx';
import { dayLabel, formatNumber, formatTemp } from '../lib/format.js';

export default function ForecastStrip({ daily = [], days = 7 }) {
  const items = daily.slice(0, days);

  return (
    <div className="forecast-strip" role="list" aria-label="Daily forecast">
      {items.map((day, index) => (
        <div
          key={day.date}
          className={`forecast-day ${index === 0 ? 'is-today' : ''}`.trim()}
          role="listitem"
        >
          <span className="forecast-day-name">{dayLabel(day.date, index)}</span>
          <WeatherIcon group={day.condition?.group} isDay size={25} className="forecast-icon" />
          <div className="forecast-temps">
            <strong>{formatTemp(day.tempMax)}</strong>
            <span>{formatTemp(day.tempMin)}</span>
          </div>
          <span className="forecast-rain" title={`${day.condition?.label || 'Rain'} · ${formatNumber(day.precipitationProbabilityMax, 0)}% chance`}>
            <Droplet size={11} aria-hidden="true" />
            {formatNumber(day.precipitationProbabilityMax, 0)}%
          </span>
        </div>
      ))}
    </div>
  );
}
