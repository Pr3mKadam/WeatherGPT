export default function StatCard({ icon: Icon, label, value, unit, hint, tone = 'default' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <span className="stat-card-icon" aria-hidden="true">
            <Icon size={17} strokeWidth={1.8} />
          </span>
        )}
      </div>
      <div className="stat-card-value">
        {value}
        {unit && <span className="stat-card-unit">{unit}</span>}
      </div>
      {hint && <p className="stat-card-hint">{hint}</p>}
    </div>
  );
}
