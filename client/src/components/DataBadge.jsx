const STATUS_LABELS = {
  live: 'Live',
  forecast: 'Forecast',
  estimated: 'Estimated',
  sample: 'Sample data',
  official: 'Official source',
  unavailable: 'Unavailable',
  modelled: 'Modelled',
};

/**
 * Makes the provenance of a number explicit. Used everywhere a value could be
 * mistaken for an official measurement.
 */
export default function DataBadge({ status = 'live', label, title, className = '' }) {
  return (
    <span
      className={`data-badge data-badge-${status} ${className}`.trim()}
      title={title || undefined}
    >
      <span className="data-badge-dot" aria-hidden="true" />
      {label || STATUS_LABELS[status] || status}
    </span>
  );
}
