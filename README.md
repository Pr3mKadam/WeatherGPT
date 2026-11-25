# WeatherGPT — EVS College Project

**WeatherGPT** is a full-stack Environmental Studies mini project that provides AI-powered weather monitoring, air quality analysis, water awareness, climate projections, sustainability tracking, and more — built as an educational platform with real data sources and transparent modelling.

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Quick Start](#quick-start)
5. [Available Scripts](#available-scripts)
6. [API Reference](#api-reference)
7. [Data Sources & Modelling](#data-sources--modelling)
8. [Pages & Modules](#pages--modules)
9. [Monitoring & Sampler](#monitoring--sampler)
10. [Team & Credits](#team--credits)
11. [License](#license)

---

## 🌤️ Project Overview

WeatherGPT is an academic awareness project designed for first-year engineering students. It demonstrates how weather, air quality, climate, water, and sustainability data can be combined into a single web application — with every number labelled by its source and methodology.

**Focus**: Environmental awareness, not official warnings. All data is model-based or estimated, with clear disclaimers.

---

## ✨ Features (All 11 Modules)

| Module | Path | Key Capabilities |
|--------|------|-----------------|
| **Landing** | `/` | Project introduction, data source overview, quick links |
| **Dashboard** | `/app` | Live overview: weather, air quality, risk score, 24h forecast, AI briefing |
| **Weather** | `/app/weather` | Current conditions, hourly forecast, city search, Pune defaults |
| **Air Pollution** | `/app/air` | AQI (CPCB-style estimate from CAMS), pollutant bars, health context, CPCB breakpoint labelling |
| **Water** | `/app/water` | Educational module on water pollution, CPCB/BIS standards, sample river demonstrations, conservation actions |
| **Climate** | `/app/climate` | CMIP6 climate projection (1950–2050), annual anomaly line chart, decadal rainfall bars, greenhouse effect, impacts, mitigation/adaptation |
| **Risk** | `/app/risk` | Composite risk score (weighted heuristic), factor breakdown, computed advisories (not official IMD/CPCB), 7-day outlook chart, risk scale |
| **Analyzer** | `/app/analyzer` | Weather–pollution correlations, scatter plots (wind/PM2.5, humidity/PM2.5, temperature/PM2.5), daily averages, stagnant‑humid “trap” hours, AI interpretation |
| **Assistant** | `/app/assistant` | Conversational AI with location context, Groq-powered answers when key configured, offline rule-based mode, localStorage history, suggested questions |
| **Sustainability** | `/app/sustainability` | Carbon‑footprint calculator (travel, electricity, diet, flights), action checklist, SDG mapping, Pune‑specific tips, comparison with India/world averages |
| **Reports** | `/app/reports` | Save snapshot dialog, filter/search saved reports, view stored payload, delete reports, download JSON |
| **Settings** | `/app/settings` | Threshold inputs (rain, heat, wind, UV, AQI), theme selector (light/dark/system), AI status, default location, team credits |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19.3.1, Vite 7.3.8, react-router-dom 7.18.7, Recharts 3.11.1, lucide-react 1.80.0 |
| **Styling** | CSS3 with custom properties (light/dark mode, CSS variables), `styles.css` + `styles-modules.css` |
| **Backend** | Node.js, Express 4.21.2, Helmet CSP, CORS, Morgan logging |
| **Database** | MongoDB Atlas (fallback: local JSON store `server/data/store.json`) |
| **AI** | Groq API (configurable via `GROQ_API_KEY` env var); offline rule-based insight mode when unconfigured |
| **Weather/AQI** | Open-Meteo (forecast + CAMS air‑quality model), CPCB-style breakpoint application |
| **River Discharge** | Open-Meteo Flood API (GloFAS v4, Copernicus EMFC) |
| **Climate Projections** | Open-Meteo Climate API (CMIP6, MRI_AGCM3_2_S, 1950–2050) |
| **Deployment** | `npm run build` → serves `client/dist` from Express; `npm run dev` → Vite + API concurrently |

---

## ⚡ Quick Start

### Option 1: Development (both servers)

```powershell
cd D:\Projects\College\EVS
npm run dev
```

- **Web app**: http://localhost:5173
- **API**: http://localhost:5000

### Option 2: Production (build + start)

```powershell
cd D:\Projects\College\EVS
npm run build     # builds client
npm start         # serves both API + built client on port 5000
```

- App runs on http://localhost:5000 (SPA fallback serves `client/dist`)

### Option 3: API Only

```powershell
cd D:\Projects\College\EVS
npm run dev:api   # nodemon on server/src
```

### First‑time setup

1. Ensure Node v20+ is installed
2. `npm install` at the repo root (265 packages, no errors)
3. Optional: set `GROQ_API_KEY` in `.env` for live AI answers
4. Optional: set `MONGODB_URI` for MongoDB Atlas (otherwise local JSON store is used)
5. Run `npm run dev` or `npm run build && npm start`

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts Vite (5173) + Express (5000) concurrently |
| `npm run dev:api` | Starts only the API server (nodemon) |
| `npm run dev:web` | Starts only the Vite dev server |
| `npm run build` | Builds the React client for production |
| `npm run start` | Starts the production Node server (serves `client/dist`) |
| `npm run smoke` | Runs `node scripts/smoke.mjs` (if present) |

---

## 🌐 API Reference

All endpoints use relative `/api` paths. Vite proxies `/api` → `http://localhost:5000`.

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Status, database mode, AI mode, cache snapshot, monitoring status |
| `GET` | `/api/environment?lat=&lon=&name=` | Weather + air quality + risk + meta for a location |
| `GET` | `/api/risk?lat=&lon=&name=` | Risk score, components, daily advisories, alerts |
| `GET` | `/api/analyzer?lat=&lon=&name=&days=` | Correlations, scatter plots, daily averages for past N days |
| `GET` | `/api/climate/projection?lat=&lon=&name=&model=` | CMIP6 projection data (annual/decadal series) |
| `GET` | `/api/content/climate` / `/api/content/water` / `/api/content/sustainability` | Static educational content modules |
| `GET` | `/api/settings` | Current thresholds, AI tone, default location |
| `PUT` | `/api/settings` | Save thresholds, AI tone, default location |
| `GET` | `/api/reports` | List saved reports (with pagination/filter) |
| `POST` | `/api/reports` | Save a new snapshot |
| `DELETE` | `/api/reports/:id` | Delete a report |
| `GET` | `/api/ai/status` | Groq configured / offline mode |
| `POST` | `/api/ai/chat` | Send a chat message to the assistant |
| `POST` | `/api/ai/analyzer-insight` | AI interpretation of analyzer correlations |
| `GET` | `/api/monitor/status` | Sampler enabled/interval/locations/samples |
| `GET` | `/api/monitor/history?lat=&lon=&name=&hours=` | Recorded + upstream history series |
| `POST` | `/api/sample` | Manually record a new sample point |
| `GET` | `/api/water/river?lat=&lon=&name=` | GloFAS river discharge for the grid cell |

### Query Parameters (common)

- `lat` / `lon` – coordinates (floats)
- `name` – location name (e.g. "Pune")
- `admin1` – state/province (e.g. "Maharashtra")
- `country` – country (e.g. "India")
- `days` – window for analyzer (3–14, default 7)
- `model` – climate model override (e.g. `MRI_AGCM3_2_S`)
- `hours` – history window in hours (max 168)

---

## 📡 Data Sources & Modelling

Every value in WeatherGPT is labelled. Below is the full provenance:

| Data Type | Source | Modelling Note |
|-----------|--------|----------------|
| **Weather forecast** | Open-Meteo model (hourly + daily reanalysis) | Free, global, no API key required. All values are model outputs. |
| **Air quality** | CAMS model (global atmospheric composition forecast) | Modelled concentrations, not CPCB station measurements. AQI is a CPCB‑style estimate applied server‑side. |
| **AQI calculation** | CPCB breakpoint application (0–50 Good, 51–100 Satisfactory, 101–200 Moderate, 201–300 Poor, 301–400 Very Poor, 401–500 Severe) | Applied to hourly CAMS pollutant concentrations (`pm2_5`, `pm10`, `no2`, `so2`, `o3`, `co`). Never display `pm2_5` concentration directly as AQI. Label as `estimated`. |
| **River discharge** | GloFAS v4 (Copernicus Emergency Management Service) | Modelled grid‑cell discharge in m³/s. One cell ≈ 5 km resolution. Not a gauge reading, not a flood warning. Label as `estimated/modelled`. |
| **Climate projection** | CMIP6 (MRI_AGCM3_2_S downscaled simulation, 1950–2050) | Annual/decadal series. Not a forecast. Label as `modelled`. |
| **AI assistant** | Groq when `GROQ_API_KEY` is set; otherwise offline rule‑based insight mode | When Groq is used, every answer carries the `AI_DISCLAIMER`. When offline, answers are generated from live data with built‑in rules and clearly labelled `Offline insight mode`. |
| **Database** | MongoDB Atlas (configured) or local JSON file (`server/data/store.json`) | If `MONGODB_URI` is absent, reports and settings fall back to `server/data/store.json`. |
| **Monitoring sampler** | Background task (every 10 min) — records weather + air quality to `server/data/monitor.json` | Enabled via `MONITOR_ENABLED=true`. Each point is tagged `upstream` (Open‑Meteo/CAMS) or `recorded` (this server). Retention: 7 days by default. |

**All disclaimers are surfaced in‑UI**: `DataBadge` statuses (`live`, `estimated`, `modelled`, `sample`), `SourceNote` components with clickable links, and page‑level descriptions make the provenance explicit.

---

## 📄 Pages & Modules

### Landing (`/`)
- Project introduction with data‑source badges
- Quick links to all 11 modules
- Academic disclaimer

### Dashboard (`/app`)
- **Weather hero**: current conditions + "Good morning/afternoon/evening" greeting
- **AQI card**: CPCB‑style estimate with pollutant breakdown
- **Risk card**: composite score + advisory badge
- **24‑hour chart**: temperature + precipitation (Area + Bar)
- **7‑day outlook**: daily max/min
- **Pollutant snapshot**: against CPCB 24‑hour standards
- **AI briefing**: Groq/offline summary of current conditions

### Weather (`/app/weather`)
- Current conditions for selected city
- City search (Open‑Meteo geocode)
- Pune defaults with live values
- Hourly forecast strip

### Air Pollution (`/app/air`)
- AQI with CPCB category label
- Pollutant bars (PM2.5, PM10, CO, NO2, SO2, O3)
- Health context and breakpoint table
- Explicit "CPCB‑style estimate, not a station reading" note

### Water (`/app/water`)
- **Educational module** on water pollution sources and effects
- **CPCB/BIS water‑quality standards** (IS 10500) with ideal/allowable ranges
- **Sample river demonstrations** — clearly labelled as teaching examples, not live measurements
- Conservation actions and prevention methods
- Standards reference table

### Climate (`/app/climate`)
- **Annual temperature anomaly** line chart (1950–2050)
- **Decadal average rainfall** bar chart
- **Greenhouse effect** in 5 steps
- **Main greenhouse gases** with GWP and lifetime
- **Impacts** on ecosystems, people, coasts, biodiversity (India‑focused)
- **Why India matters** — monsoon, exposure, vulnerability
- Mitigation & adaptation action lists
- References and disclaimer

### Risk (`/app/risk`)
- **Risk gauge** (0–100, coloured Low/Moderate/High/Severe)
- **Factor breakdown**: air (35%), heat (20%), rain (20%), wind (15%), UV (10%)
- **Computed advisories** with clear "not official IMD/CPCB" labelling
- **7‑day risk outlook** chart
- **Risk scale** with severity bands and precautions
- Methodology disclaimer

### Analyzer (`/app/analyzer`)
- **Correlation summary** (Pearson's r for wind, humidity, temperature vs PM2.5/PM10)
- **Scatter plots**: wind vs PM2.5, humidity vs PM2.5, temperature vs PM2.5
- **Stagnant, humid "pollution trap" hours** count and definition
- **Daily averages** table (PM2.5, PM10, wind, temp, rain)
- **AI interpretation** button (Groq/offline) with causality caveats
- Dominant pattern description + correlation‑is‑not‑causation note

### Assistant (`/app/assistant`)
- Chat interface with suggested questions
- Location context injected into every answer
- Groq‑powered answers when `GROQ_API_KEY` configured
- **Offline insight mode** clearly labelled when no key
- LocalStorage conversation history (persisted across sessions)
- System prompt: "must not present computed advisories as official IMD or CPCB warnings"

### Sustainability (`/app/sustainability`)
- **Carbon‑footprint calculator** (travel, electricity, cooking, diet, flights)
- Breakdown by category with kg CO₂e / year
- Comparison with India and world averages
- **Action checklist** — tick actions, see estimated annual savings (kg CO₂, Litres water)
- **SDG mapping** — local actions connected to global goals
- Pune‑specific everyday habits tips

### Reports (`/app/reports`)
- **Save snapshot** dialog: title, kind (weather/air/risk/analysis/custom), notes, tags
- **List/filter/search** saved reports
- **View detail** page with stored payload
- **Delete** reports with confirmation
- **Download** individual report as JSON
- MongoDB Atlas storage with local JSON fallback

### Settings (`/app/settings`)
- **Threshold inputs**: heavy rain, very heavy rain, hourly rain, heatwave, severe heat, strong wind, Poor/Very Poor AQI, High UV
- **Theme selector**: light / dark / system
- **AI tone**: concise / detailed / friendly
- **AI status**: Groq configured / offline mode
- **Data source overview**: Open‑Meteo, CAMS, CPCB, GloFAS, CMIP6, Groq, database
- **Team credits** and academic disclaimer

---

## 🏃‍♂️ Running the Project

### Development mode (recommended)

```powershell
cd D:\Projects\College\EVS
npm run dev
```

This starts:
- **Vite** at http://localhost:5173 (dev server with HMR)
- **Express** at http://localhost:5000 (API with all routes, CORS, SPA fallback)

Open http://localhost:5173 in your browser. The Vite dev proxy will route `/api/*` to the Express server.

### Production mode

```powershell
cd D:\Projects\College\EVS
npm run build     # creates client/dist
npm start         # serves API + SPA from port 5000
```

The production build minifies React, removes `React.StrictMode` double‑renders, and serves the built app from the Express server.

### API only

```powershell
cd D:\Projects\College\EVS
npm run dev:api
```

Useful for testing API endpoints or connecting a frontend from another origin.

---

## 🔐 Environment Variables

Create a `.env` file in the repo root (or `server/.env`) with optional values:

```env
# AI (optional — defaults to offline mode)
GROQ_API_KEY=your_groq_key_here

# Database (optional — local JSON store used if absent)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/weathergpt

# Server
PORT=5000
NODE_ENV=development

# Client origin (for CORS)
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# Monitoring (optional)
MONITOR_ENABLED=true          # default: true
MONITOR_INTERVAL_MINUTES=10   # default: 10
MONITOR_RETENTION_DAYS=7      # default: 7
MONITOR_MAX_POINTS=1000       # default: 1000

# Climate model (optional)
CLIMATE_MODEL=MRI_AGCM3_2_S   # default: MRI_AGCM3_2_S
```

---

## 👥 Team

| Name | Role | Institution |
|------|------|-------------|
| **Samyak Chordiya** | Full‑stack development | MIT Academy of Engineering, Alandi, Pune |
| **Prem Kadam** | Full‑stack development | MIT Academy of Engineering, Alandi, Pune |
| **Yash Deore** | Backend & data modelling | MIT Academy of Engineering, Alandi, Pune |
| **Harshali Rajput** | UI/UX and sustainability module | MIT Academy of Engineering, Alandi, Pune |

**Course**: Information Technology, IT A1  
**Academic Year**: 2026–27  
**Institution**: MIT Academy of Engineering, Alandi, Pune

---

## 📜 Disclaimer

> WeatherGPT is an **academic awareness project**. It is **not affiliated with IMD, CPCB, Open‑Meteo or Groq**, and it is **not an official warning service**.
>
> - All weather and air‑quality values are **model outputs**, not official measurements.
> - The AQI is a **CPCB‑style estimate**, not a station‑based reading.
> - Risk advisories are **computed heuristics**, not official IMD or CPCB warnings.
> - River discharge is a **modelled grid‑cell value**, not a gauge reading.
> - Climate projections are **CMIP6 simulations**, not forecasts.
> - The AI assistant uses Groq when configured, otherwise a **transparent rule‑based insight mode**. All AI answers carry disclaimers stating they are general awareness, not medical or official advice.
>
> **Always check official sources** (IMD, CPCB, Central Water Commission, BIS) for safety‑critical decisions.

---

## 📂 Project Structure

```
weathergpt/
├── package.json              — root workspace (workspaces: server, client)
├── .env.example             — environment variable templates
├── .gitignore
├── node_modules/            — 265+ packages
│
├── client/                  — React + Vite frontend
│   ├── package.json
│   ├── vite.config.js       — proxies /api → http://localhost:5000
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx          — providers + BrowserRouter
│   │   ├── App.jsx           — all 11 routes wired
│   │   ├── styles.css        — global design system (light/dark, landing, app shell)
│   │   ├── styles-modules.css — page‑specific CSS classes
│   │   ├── context/          — ThemeContext, LocationContext, ToastContext
│   │   ├── hooks/            — useApi, useAction, useDocumentTitle
│   │   ├── lib/              — api.js, format.js, aqi.js, nav.jsx
│   │   ├── components/       — Logo, WeatherIcon, DataBadge, PageHeader, StatCard,
│   │   │                   Loading, ErrorState, SourceNote, ChartCard, AqiGauge,
│   │   │                   RiskGauge, ForecastStrip, AlertCard, PollutantBars,
│   │   │                   LocationSearch, Sidebar, Topbar, AppLayout
│   │   └── pages/            — Landing, Dashboard, Weather, AirPollution, Water,
│   │                       Climate, Risk, Analyzer, Assistant, Sustainability,
│   │                       Reports, Settings, Placeholders (NotFound)
│   └── dist/                 — production build output
│
└── server/                  — Node/Express backend
    ├── package.json
    ├── src/
    │   ├── index.js           — entry: initStore, startMonitoring, listen(5000)
    │   ├── routes/            — 13 route modules (health, geo, weather, air,
    │   │                   environment, climate, analyzer, alerts, risk, ai,
    │   │                   reports, settings, monitor, water)
    │   ├── services/           — openMeteo.js, aqi.js, risk.js, climate.js,
    │   │                   groq.js, environment.js, analyzer.js, groqChat.js,
    │   │                   flood.js, monitor.js, weatherCodes.js
    │   ├── lib/                — utils.js, cache.js, http.js, validate.js
    │   ├── data/               — store.json (reports/settings), monitor.json (sampler),
    │   │                   climate.json, defaults.json, water.json, sustainability.json
    │   └── db/                 — jsonStore.js, models.js, index.js
    └── data/                  — static content (water.js, climate.js, sustainability.js)
```

---

## 🛠️ Development Notes

- **CSS**: `styles.css` contains global layout + light‑dark mode base. `styles-modules.css` contains all page‑specific component classes (fact‑grid, risk‑gauge, sustain‑action, etc.). Both are imported in `main.jsx`.
- **Responsive**: Breakpoints at 1100px, 960px, 760px, 520px — grid layouts switch from 2‑column to single‑column automatically.
- **Error boundaries**: All pages show `ErrorState` on API failure; `Loading` skeleton cards during fetch.
- **CORS**: Express allows `http://localhost:5173` and `127.0.0.1:5173` by default; production should set `CLIENT_ORIGIN`.
- **Graceful shutdown**: SIGTERM/SIGINT closes the server and the monitoring sampler cleanly.
- **No git repo** originally; `git init` was run during this session. The repo is now at `https://github.com/Pr3mKadam/WeatherGPT.git`.

---

## 🙏 Acknowledgments

- Data provided by **Open-Meteo** (free, no‑key weather & flood APIs)
- Air‑quality modelled by **CAMS** (Copernicus Atmosphere Monitoring Service)
- AQI breakpoint standards from **CPCB** (Central Pollution Control Board, India)
- River discharge from **GloFAS** (Copernicus Emergency Management Service)
- AI inference via **Groq** (when API key is provided)
- Climate projections from **CMIP6** (IPCC‑approved model ensemble)
- Educational content reference: **BIS** (Bureau of Indian Standards, IS 10500)
- Designed as an **EVS (Environmental Studies) college project** — MIT Academy of Engineering, Alandi, Pune

---

*Generated for the WeatherGPT EVS project. For questions or contributions, contact the team at MIT Academy of Engineering, IT A1, 2026–27.*