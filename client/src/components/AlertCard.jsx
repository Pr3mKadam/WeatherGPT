import { CloudLightning, CloudRain, Sun, Thermometer, Wind } from 'lucide-react';

const CATEGORY_ICONS = {
  rain: CloudRain,
  heat: Thermometer,
  wind: Wind,
  air: Wind,
  uv: Sun,
  storm: CloudLightning,
};

export default function AlertCard({ alert, compact = false }) {
  const Icon = CATEGORY_ICONS[alert.category] || Wind;

  return (
    <article className={`alert-card severity-${alert.severity} ${compact ? 'alert-compact' : ''}`.trim()}>
      <span className="alert-icon" aria-hidden="true">
        <Icon size={compact ? 18 : 20} />
      </span>
      <div className="alert-body">
        <div className="alert-top">
          <span className="alert-severity">{alert.severityLabel}</span>
          {alert.day && <span className="alert-day">{alert.day}</span>}
          {alert.category && <span className="alert-category">{alert.category}</span>}
        </div>
        <h3>{alert.title}</h3>
        <p>{alert.reason}</p>
        {!compact && alert.advice && (
          <p className="alert-advice">
            <strong>What to do:</strong> {alert.advice}
          </p>
        )}
        {!compact && alert.source && <span className="alert-source">{alert.source}</span>}
      </div>
    </article>
  );
}
