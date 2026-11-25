import { Link } from 'react-router-dom';

export default function Logo({ to = '/', compact = false, subtitle = null }) {
  return (
    <Link to={to} className="brand" aria-label="WeatherGPT home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M26.5 5.5C16.2 5.8 9.4 11.2 9.4 18.1c0 3.3 2.7 6 6 6 6.9 0 12.3-6.8 11.1-18.6Z"
            fill="currentColor"
          />
          <path
            d="M7 27.5c1.9-6.4 6.1-10.6 11.7-13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>
      </span>
      {!compact && (
        <span className="brand-copy">
          <span className="brand-text">
            Weather<span>GPT</span>
          </span>
          {subtitle && <span className="brand-subtitle">{subtitle}</span>}
        </span>
      )}
    </Link>
  );
}
