import { clamp } from '../lib/format.js';

const CX = 110;
const CY = 112;
const R = 86;
const ARC_LENGTH = Math.PI * R;

export default function AqiGauge({ value, category, color = '#22A06B', size = 240, label = 'Estimated AQI' }) {
  const safeValue = Number.isFinite(Number(value)) ? clamp(Number(value), 0, 500) : 0;
  const ratio = safeValue / 500;
  const arc = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  return (
    <div className="gauge" style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox="0 0 220 152" role="img" aria-label={`${label}: ${safeValue}, ${category || 'unavailable'}`}>
        <path d={arc} className="gauge-track" strokeWidth="13" fill="none" strokeLinecap="round" />
        <path
          d={arc}
          stroke={color}
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH * ratio} ${ARC_LENGTH}`}
          className="gauge-progress"
        />
        {[0, 100, 200, 300, 400, 500].map((tick) => {
          const angle = Math.PI * (1 - tick / 500);
          const x1 = CX + Math.cos(angle) * (R - 18);
          const y1 = CY - Math.sin(angle) * (R - 18);
          const x2 = CX + Math.cos(angle) * (R - 25);
          const y2 = CY - Math.sin(angle) * (R - 25);
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--text-soft)"
              strokeWidth="1.4"
              opacity="0.5"
            />
          );
        })}
        <text x={CX} y="92" textAnchor="middle" className="gauge-value" fill="var(--text)">
          {Number.isFinite(Number(value)) ? Math.round(Number(value)) : '—'}
        </text>
        <text x={CX} y="116" textAnchor="middle" className="gauge-label" fill="var(--text-muted)">
          {label}
        </text>
        <text x="24" y="140" className="gauge-scale" fill="var(--text-soft)">0</text>
        <text x="188" y="140" className="gauge-scale" fill="var(--text-soft)">500</text>
      </svg>
      {category && (
        <span className="gauge-category" style={{ color }}>
          {category}
        </span>
      )}
    </div>
  );
}
