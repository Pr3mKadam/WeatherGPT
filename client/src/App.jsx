import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Weather from './pages/Weather.jsx';
import AirPollution from './pages/AirPollution.jsx';
import Water from './pages/Water.jsx';
import Climate from './pages/Climate.jsx';
import Risk from './pages/Risk.jsx';
import Analyzer from './pages/Analyzer.jsx';
import Assistant from './pages/Assistant.jsx';
import Sustainability from './pages/Sustainability.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import { NotFound } from './pages/Placeholders.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="weather" element={<Weather />} />
        <Route path="air" element={<AirPollution />} />
        <Route path="water" element={<Water />} />
        <Route path="climate" element={<Climate />} />
        <Route path="risk" element={<Risk />} />
        <Route path="analyzer" element={<Analyzer />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="sustainability" element={<Sustainability />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
