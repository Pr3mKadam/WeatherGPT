export default function ChartCard({ title, subtitle, badge, actions, children, className = '', height }) {
  return (
    <section className={`card chart-card ${className}`.trim()}>
      <header className="card-head">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        <div className="card-head-right">
          {badge}
          {actions}
        </div>
      </header>
      <div className="chart-body" style={height ? { height } : undefined}>
        {children}
      </div>
    </section>
  );
}
