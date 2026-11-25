import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CloudSun,
  Droplets,
  Gauge,
  Leaf,
  MapPin,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Wind,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import DataBadge from '../components/DataBadge.jsx';
import WeatherIcon from '../components/WeatherIcon.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { DEFAULT_LOCATION } from '../context/LocationContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { locationParams } from '../lib/api.js';
import { NAV_GROUPS } from '../lib/nav.jsx';
import { formatNumber, formatTemp, relativeTime } from '../lib/format.js';

const TEAM = [
  { name: 'Samyak Chordiya', initials: 'SC' },
  { name: 'Prem Kadam', initials: 'PK' },
  { name: 'Yash Deore', initials: 'YD' },
  { name: 'Harshali Rajput', initials: 'HR' },
];

const MODULES = NAV_GROUPS.flatMap((group) => group.items);

const PILLARS = [
  {
    number: '01',
    title: 'Monitor',
    icon: CloudSun,
    copy: 'Live weather, modelled air quality and computed advisories for any city you search.',
  },
  {
    number: '02',
    title: 'Understand',
    icon: Leaf,
    copy: 'Plain-language explainers for AQI, water quality, climate trends and the links between them.',
  },
  {
    number: '03',
    title: 'Act',
    icon: ShieldCheck,
    copy: 'Grounded AI answers, a carbon-footprint estimate and everyday actions that actually add up.',
  },
];

function HeroScene() {
  return (
    <svg
      viewBox="0 0 560 460"
      className="hero-scene-svg"
      role="img"
      aria-label="Illustration of green hills, a river, trees and wind turbines under a bright sun"
    >
      <defs>
        <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B2C1D" />
          <stop offset="0.55" stopColor="#124A32" />
          <stop offset="1" stopColor="#1A6B49" />
        </linearGradient>
        <linearGradient id="heroHillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1C6A4A" />
          <stop offset="1" stopColor="#12452F" />
        </linearGradient>
        <linearGradient id="heroHillMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#155A3D" />
          <stop offset="1" stopColor="#0C3524" />
        </linearGradient>
        <linearGradient id="heroHillNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E442D" />
          <stop offset="1" stopColor="#082418" />
        </linearGradient>
        <linearGradient id="heroRiver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9BD8F5" />
          <stop offset="1" stopColor="#5BA7D9" />
        </linearGradient>
        <radialGradient id="heroSunGlow">
          <stop offset="0" stopColor="#FFE9AE" stopOpacity="0.75" />
          <stop offset="0.55" stopColor="#FFE9AE" stopOpacity="0.16" />
          <stop offset="1" stopColor="#FFE9AE" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="560" height="460" rx="30" fill="url(#heroSky)" />

      <circle cx="430" cy="112" r="120" fill="url(#heroSunGlow)" />
      <circle cx="430" cy="112" r="38" fill="#FFE3A0" />

      <g fill="#CFEADB" opacity="0.5">
        <ellipse cx="126" cy="112" rx="46" ry="12" />
        <ellipse cx="156" cy="102" rx="30" ry="11" />
        <ellipse cx="100" cy="104" rx="26" ry="9" />
        <ellipse cx="320" cy="72" rx="34" ry="9" opacity="0.6" />
      </g>

      <g stroke="#CFEADB" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55">
        <path d="M206 132c6-6 12-6 18 0" />
        <path d="M232 122c5-5 10-5 15 0" />
        <path d="M190 152c5-5 10-5 15 0" />
      </g>

      <path d="M0 300c62-44 122-64 186-52 56 10 96 38 154 34 70-5 120-46 220-34v212H0Z" fill="url(#heroHillFar)" />
      <path d="M0 342c78-34 138-38 204-18 54 16 96 44 160 34 70-11 112-40 196-26v128H0Z" fill="url(#heroHillMid)" />

      <path
        d="M312 460c-10-38 8-70 40-96 30-25 42-49 38-82 32 30 30 66 2 92-28 26-40 48-36 86Z"
        fill="url(#heroRiver)"
        opacity="0.9"
      />

      <path d="M0 386c90-24 150-16 212 8 46 18 90 22 140 12 78-15 128-32 208-12v66H0Z" fill="url(#heroHillNear)" />

      <g stroke="#EAF6EE" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M122 322v-96" />
        <path d="M122 226l-30-26" />
        <path d="M122 226l36-10" />
        <path d="M122 226l-4 38" />
        <circle cx="122" cy="226" r="5" fill="#EAF6EE" stroke="none" />
      </g>
      <g stroke="#BFE6D3" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M196 334v-70" />
        <path d="M196 264l-22-18" />
        <path d="M196 264l26-8" />
        <path d="M196 264l-2 28" />
        <circle cx="196" cy="264" r="4" fill="#BFE6D3" stroke="none" />
      </g>

      <g fill="#2F9268">
        <path d="M74 356l16-38 16 38Z" />
        <path d="M74 380l16-38 16 38Z" />
        <rect x="87" y="384" width="6" height="18" rx="2" fill="#0A2A1B" />
      </g>
      <g fill="#3AA377">
        <path d="M420 386l18-44 18 44Z" />
        <path d="M420 414l18-44 18 44Z" />
        <rect x="435" y="418" width="6" height="16" rx="2" fill="#0A2A1B" />
      </g>
      <g fill="#2F9268" opacity="0.9">
        <path d="M362 402l12-30 12 30Z" />
        <path d="M362 422l12-30 12 30Z" />
      </g>

      <g fill="#FFE3A0" opacity="0.8">
        <circle cx="88" cy="288" r="2.4" />
        <circle cx="462" cy="268" r="2" />
        <circle cx="330" cy="214" r="2" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const { resolved, toggle } = useTheme();
  const path = `/environment?${locationParams(DEFAULT_LOCATION)}`;
  const { data } = useApi(path);
  const env = data;
  const current = env?.weather?.current;
  const aqi = env?.air?.aqi;

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Logo to="/" subtitle="Environmental intelligence" />
          <nav className="landing-links" aria-label="Landing page">
            <a href="#modules">Modules</a>
            <a href="#approach">Approach</a>
            <a href="#team">Team</a>
          </nav>
          <div className="landing-nav-actions">
            <button
              type="button"
              className="icon-btn landing-theme"
              onClick={toggle}
              aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/app" className="btn btn-primary btn-sm">
              Open dashboard
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <div className="hero-copy">
              <span className="hero-pill">
                <Sparkles size={14} aria-hidden="true" />
                EVS Mini Project · 2026–27
              </span>
              <h1>
                Understand the air you breathe and the sky above you.
              </h1>
              <p className="hero-lede">
                WeatherGPT turns live weather, modelled air quality and climate science into clear,
                honest answers — built for students, not shareholders.
              </p>
              <div className="hero-actions">
                <Link to="/app" className="btn btn-primary">
                  Explore the dashboard
                  <ArrowRight size={16} />
                </Link>
                <a href="#modules" className="btn btn-ghost">
                  See all 11 modules
                </a>
              </div>
              <div className="hero-stats">
                <div>
                  <strong>11</strong>
                  <span>connected modules</span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>live data feeds</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>AQI standard, labelled</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-scene">
                <HeroScene />
              </div>

              <div className="floating-card floating-temp">
                <div className="floating-card-head">
                  <span>
                    <MapPin size={13} aria-hidden="true" />
                    {DEFAULT_LOCATION.name}
                  </span>
                  <DataBadge status="live" />
                </div>
                {current ? (
                  <>
                    <div className="floating-temp-row">
                      <WeatherIcon
                        group={current.condition?.group}
                        isDay={current.isDay}
                        size={30}
                      />
                      <strong>{formatTemp(current.temperature)}</strong>
                    </div>
                    <span className="floating-sub">
                      {current.condition?.label} · feels {formatTemp(current.apparentTemperature)}
                    </span>
                  </>
                ) : (
                  <div className="floating-skeleton">
                    <span />
                    <span />
                  </div>
                )}
              </div>

              <div className="floating-card floating-aqi">
                <div className="floating-card-head">
                  <span>
                    <Gauge size={13} aria-hidden="true" />
                    Air quality
                  </span>
                  <DataBadge status="estimated" />
                </div>
                {aqi ? (
                  <>
                    <div className="floating-aqi-row">
                      <strong style={{ color: aqi.color }}>{aqi.value}</strong>
                      <span className="floating-aqi-label" style={{ color: aqi.color }}>
                        {aqi.category}
                      </span>
                    </div>
                    <span className="floating-sub">
                      PM2.5 {formatNumber(env?.air?.current?.pm25, 1)} µg/m³
                    </span>
                  </>
                ) : (
                  <div className="floating-skeleton">
                    <span />
                    <span />
                  </div>
                )}
              </div>

              <div className="floating-card floating-risk">
                <ShieldCheck size={18} aria-hidden="true" />
                <div>
                  <span>Environmental risk</span>
                  <strong>{env?.risk ? `${env.risk.score}/100 · ${env.risk.level}` : '—'}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="source-strip" aria-label="Data sources">
          <div className="source-strip-inner">
            <span className="source-strip-label">Grounded in</span>
            {['Open-Meteo', 'CAMS', 'CMIP6', 'CPCB', 'IMD', 'Groq'].map((source) => (
              <span className="source-chip" key={source}>
                {source}
              </span>
            ))}
            <span className="source-strip-note">
              Official references are linked, never imitated.
            </span>
          </div>
        </section>

        <section className="landing-section" id="modules">
          <div className="section-head">
            <span className="eyebrow">What's inside</span>
            <h2>One project, the whole environmental picture.</h2>
            <p>
              Weather and pollution are connected to water, climate and the choices we make. Each
              module is built to make one of those connections obvious.
            </p>
          </div>

          <div className="module-grid">
            {MODULES.map((item) => (
              <Link to={item.to} className="module-card" key={item.to}>
                <span className="module-icon" aria-hidden="true">
                  <item.icon size={20} strokeWidth={1.8} />
                </span>
                <div className="module-copy">
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>
                <ArrowUpRight size={16} className="module-arrow" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section-alt" id="approach">
          <div className="section-head">
            <span className="eyebrow">The approach</span>
            <h2>Monitor. Understand. Act.</h2>
            <p>
              Data without context is noise. WeatherGPT pairs every number with where it came from,
              what it means, and what a person can reasonably do about it.
            </p>
          </div>
          <div className="pillar-grid">
            {PILLARS.map((pillar) => (
              <article className="pillar-card" key={pillar.number}>
                <span className="pillar-number">{pillar.number}</span>
                <span className="pillar-icon" aria-hidden="true">
                  <pillar.icon size={22} strokeWidth={1.8} />
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.copy}</p>
              </article>
            ))}
          </div>

          <div className="honesty-card">
            <div className="honesty-icon" aria-hidden="true">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3>Labelled honestly, by design</h3>
              <p>
                Weather is a forecast. Air quality is a model estimate. The AQI is calculated with
                CPCB breakpoints, not copied from a CPCB station. Water-quality demonstrations are
                marked as samples. Advisories are computed, not official IMD warnings.
              </p>
            </div>
            <Link to="/app/settings" className="btn btn-ghost btn-sm">
              Data & sources
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="landing-section" id="team">
          <div className="section-head">
            <span className="eyebrow">The team</span>
            <h2>Built by four first-year IT students.</h2>
            <p>
              Department of Information Technology, IT A1, MIT Academy of Engineering, Alandi,
              Pune. Academic year 2026–27.
            </p>
          </div>
          <div className="team-grid">
            {TEAM.map((member) => (
              <article className="team-card" key={member.name}>
                <span className="team-avatar" aria-hidden="true">
                  {member.initials}
                </span>
                <h3>{member.name}</h3>
                <p>Department of Information Technology</p>
                <span className="team-tag">IT A1 · 2026–27</span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-cta-inner">
            <div>
              <span className="eyebrow">Ready when you are</span>
              <h2>Start with the air outside your window.</h2>
              <p>
                Pune is loaded by default. Search any city, then follow the data into water,
                climate and the choices that connect them.
              </p>
            </div>
            <Link to="/app" className="btn btn-primary">
              Open WeatherGPT
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-brand">
            <Logo to="/" />
            <p>
              Conversational AI for weather forecasting, air-quality awareness and climate
              information.
            </p>
          </div>
          <div className="footer-links">
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer noopener">
              Open-Meteo
            </a>
            <a href="https://cpcb.nic.in/" target="_blank" rel="noreferrer noopener">
              CPCB
            </a>
            <a href="https://mausam.imd.gov.in/" target="_blank" rel="noreferrer noopener">
              IMD
            </a>
            <a href="https://www.ipcc.ch/" target="_blank" rel="noreferrer noopener">
              IPCC
            </a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 WeatherGPT · MIT Academy of Engineering, Alandi, Pune</span>
          <span>
            Academic project. Not affiliated with IMD, CPCB or Open-Meteo. Not an official warning
            service.
          </span>
        </div>
      </footer>
    </div>
  );
}
