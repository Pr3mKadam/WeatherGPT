import { clamp } from '../lib/format.js';

const CX = 110;
const CY = 112;
const R = 86;
const ARC_LENGTH = Math.PI * R;

export default function RiskGauge({ value, level, color = '#22A06B', size = 220 }) {
  const safeValue = Number.isFinite(Number(value)) ? clamp(Number(value), 0, 100) : 0;
  const ratio = safeValue / 100;
  const arc = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  return (
    <div className="gauge" style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox="0 0 220 152" role="img" aria-label={`Environmental risk score ${safeValue} out of 100, ${level}`}>
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
        <text x={CX} y="92" textAnchor="middle" className="gauge-value" fill="var(--text)">
          {Math.round(safeValue)}
        </text>
        <text x={CX} y="116" textAnchor="middle" className="gauge-label" fill="var(--text-muted)">
          out of 100
        </text>
        <text x="24" y="140" className="gauge-scale" fill="var(--text-soft)">0</text>
        <text x="188" y="140" className="gauge-scale" fill="var(--text-soft)">100</text>
      </svg>
      {level && (
        <span className="gauge-category" style={{ color }}>
          {level} risk
        </span>
      )}
    </div>
  );
}
