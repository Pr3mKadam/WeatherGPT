import { formatNumber } from '../lib/format.js';

export default function PollutantBars({ items = [], compact = false }) {
  return (
    <div className={`pollutant-list ${compact ? 'pollutant-compact' : ''}`.trim()}>
      {items.map((item) => {
        const standard = Number(item.standard) || 0;
        const ratio = standard > 0 ? Math.min(2, Number(item.concentration) / standard) : 0;
        const tone = ratio > 1.5 ? 'danger' : ratio > 1 ? 'warn' : 'good';
        const width = Math.max(4, ratio * 50);

        return (
          <div className="pollutant-row" key={item.key}>
            <div className="pollutant-row-head">
              <span className="pollutant-name">{item.label}</span>
              <span className="pollutant-value">
                {formatNumber(item.concentration, item.key === 'co' ? 2 : 1)}
                <em>{item.unit}</em>
              </span>
            </div>
            <div
              className="pollutant-track"
              role="img"
              aria-label={`${item.label}: ${formatNumber(item.concentration, 1)} ${item.unit}, CPCB standard ${item.standard} ${item.unit}`}
            >
              <span className={`pollutant-fill ${tone}`} style={{ width: `${width}%` }} />
              {standard > 0 && <span className="pollutant-standard-mark" title="CPCB standard" />}
            </div>
            <div className="pollutant-meta">
              <span>CPCB standard {item.standard} {item.unit}</span>
              <span>Sub-index {item.subIndex}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
