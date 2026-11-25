import { NavLink } from 'react-router-dom';
import { Leaf, Settings, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { NAV_GROUPS, SETTINGS_ITEM } from '../lib/nav.jsx';

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? 'is-open' : ''}`.trim()} aria-label="Main navigation">
        <div className="sidebar-head">
          <Logo to="/app" subtitle="Environmental intelligence" />
          <button type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`.trim()}
                >
                  <item.icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to={SETTINGS_ITEM.to}
            onClick={onClose}
            className={({ isActive }) => `nav-item nav-item-settings ${isActive ? 'active' : ''}`.trim()}
          >
            <Settings size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Settings</span>
          </NavLink>

          <div className="sidebar-card">
            <span className="sidebar-card-icon" aria-hidden="true">
              <Leaf size={18} />
            </span>
            <div>
              <strong>EVS Mini Project</strong>
              <span>IT A1 · 2026–27</span>
            </div>
          </div>
          <p className="sidebar-footnote">MIT Academy of Engineering, Alandi</p>
        </div>
      </aside>

      <button
        type="button"
        className={`sidebar-overlay ${open ? 'is-open' : ''}`.trim()}
        onClick={onClose}
        aria-label="Close navigation overlay"
        tabIndex={open ? 0 : -1}
      />
    </>
  );
}
