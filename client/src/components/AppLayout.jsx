import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const routerLocation = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [routerLocation.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    function handleKey(event) {
      if (event.key === 'Escape') setSidebarOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    document.body.classList.add('nav-open');
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('nav-open');
    };
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-body">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="app-main" id="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            WeatherGPT · Environmental Studies project, MIT Academy of Engineering, Alandi, Pune.
          </span>
          <span>
            Data: Open-Meteo, CAMS, CMIP6 · References: CPCB, IMD · Not an official warning service.
          </span>
        </footer>
      </div>
    </div>
  );
}
