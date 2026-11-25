import { Info } from 'lucide-react';

export default function SourceNote({ children, sources, className = '' }) {
  return (
    <div className={`source-note ${className}`.trim()}>
      <Info size={14} aria-hidden="true" />
      <div>
        {children}
        {sources?.length ? (
          <span className="source-links">
            {sources.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="source-link"
              >
                {source.name}
              </a>
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
