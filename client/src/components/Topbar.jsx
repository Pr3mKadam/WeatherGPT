import { useLocation as useRouterLocation } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import LocationSearch from './LocationSearch.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { findNavItem } from '../lib/nav.jsx';

export default function Topbar({ onMenu }) {
  const routerLocation = useRouterLocation();
  const { location } = useLocation();
  const { resolved, toggle } = useTheme();
  const item = findNavItem(routerLocation.pathname);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-btn menu-btn" onClick={onMenu} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <div className="topbar-context">
          <span className="topbar-breadcrumb">
            WeatherGPT <span aria-hidden="true">/</span> {item.label}
          </span>
          <span className="topbar-date">
            {today} · {location.name}
          </span>
        </div>
      </div>

      <div className="topbar-right">
        <LocationSearch />
        <span className="api-status" title="Weather and air-quality data are fetched from the WeatherGPT API on page load">
          <span className="api-status-dot" aria-hidden="true" />
          <span className="api-status-text">Live API</span>
        </span>
        <button
          type="button"
          className="icon-btn"
          onClick={toggle}
          aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
