import { Loader2 } from 'lucide-react';

export function Spinner({ size = 18, label = 'Loading' }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <Loader2 size={size} className="spin" />
    </span>
  );
}

export function Skeleton({ width, height = 16, radius = 8, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 3, height = 160 }) {
  return (
    <div className="card skeleton-card" style={{ minHeight: height }}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="65%" height={30} />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} width={`${90 - index * 12}%`} height={12} />
      ))}
    </div>
  );
}

export function PageLoader({ label = 'Loading environmental data…' }) {
  return (
    <div className="page-loader" role="status">
      <Loader2 size={26} className="spin" />
      <p>{label}</p>
    </div>
  );
}
