import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
  retryLabel = 'Try again',
  compact = false,
}) {
  const message =
    error?.message || 'The data could not be loaded. Please check your connection and try again.';
  const isNetwork = error?.code === 'network_error';

  return (
    <div className={`state-box state-error ${compact ? 'state-compact' : ''}`.trim()} role="alert">
      <span className="state-icon" aria-hidden="true">
        <AlertTriangle size={22} />
      </span>
      <div className="state-copy">
        <h3>{title}</h3>
        <p>{message}</p>
        {isNetwork && (
          <p className="state-hint">
            Start both servers with <code>npm run dev</code> from the project root.
          </p>
        )}
      </div>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          <RefreshCw size={15} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
