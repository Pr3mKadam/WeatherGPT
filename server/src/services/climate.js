import { config } from '../config.js';
import { fetchJson, buildUrl } from '../lib/http.js';
import { isNum, mean, round } from '../lib/utils.js';

const CLIMATE_URL = 'https://climate-api.open-meteo.com/v1/climate';

const START_YEAR = 1950;
const END_YEAR = 2050;

function periodMean(annual, start, end, key) {
  const values = annual
    .filter((row) => row.year >= start && row.year <= end)
    .map((row) => row[key])
    .filter(isNum);
  return mean(values);
}

function linearSlope(points) {
  const valid = points.filter((p) => isNum(p.y));
  if (valid.length < 5) return null;
  const n = valid.length;
  const mx = valid.reduce((a, p) => a + p.x, 0) / n;
  const my = valid.reduce((a, p) => a + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of valid) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

/**
 * CMIP6 climate projection from Open-Meteo's Climate API.
 * We aggregate the daily response to annual values on the server so the browser
 * receives a small, chart-ready series instead of ~37,000 daily rows.
 */
export async function fetchClimateProjection({ lat, lon, model = config.climateModel }) {
  const url = buildUrl(CLIMATE_URL, {
    latitude: lat,
    longitude: lon,
    start_date: `${START_YEAR}-01-01`,
    end_date: `${END_YEAR}-12-31`,
    models: model,
    daily: 'temperature_2m_mean,precipitation_sum',
    timezone: 'auto',
  });

  const data = await fetchJson(url, { timeoutMs: 60000, service: 'Open-Meteo climate projection' });

  const times = data?.daily?.time || [];
  const temps = data?.daily?.temperature_2m_mean || [];
  const precip = data?.daily?.precipitation_sum || [];

  if (!times.length) {
    throw new Error('The climate service returned no daily data.');
  }

  const years = new Map();
  for (let i = 0; i < times.length; i += 1) {
    const year = Number(times[i].slice(0, 4));
    if (!years.has(year)) {
      years.set(year, { year, tempSum: 0, tempCount: 0, precipSum: 0, precipCount: 0 });
    }
    const bucket = years.get(year);
    if (isNum(temps[i])) {
      bucket.tempSum += Number(temps[i]);
      bucket.tempCount += 1;
    }
    if (isNum(precip[i])) {
      bucket.precipSum += Number(precip[i]);
      bucket.precipCount += 1;
    }
  }

  const annual = [...years.values()]
    .map((bucket) => ({
      year: bucket.year,
      temp: bucket.tempCount ? round(bucket.tempSum / bucket.tempCount, 2) : null,
      precip: bucket.precipCount ? round(bucket.precipSum, 0) : null,
    }))
    .sort((a, b) => a.year - b.year);

  const baselineTemp = periodMean(annual, 1951, 1980, 'temp');
  const baselinePrecip = periodMean(annual, 1951, 1980, 'precip');
  const recentTemp = periodMean(annual, 1995, 2014, 'temp');
  const recentPrecip = periodMean(annual, 1995, 2014, 'precip');
  const projectedTemp = periodMean(annual, 2041, 2050, 'temp');
  const projectedPrecip = periodMean(annual, 2041, 2050, 'precip');

  const withAnomaly = annual.map((row) => ({
    ...row,
    anomaly: isNum(row.temp) && isNum(baselineTemp) ? round(row.temp - baselineTemp, 2) : null,
  }));

  const decades = new Map();
  for (const row of annual) {
    const decade = Math.floor(row.year / 10) * 10;
    if (!decades.has(decade)) decades.set(decade, { decade, temps: [], precip: [] });
    const bucket = decades.get(decade);
    if (isNum(row.temp)) bucket.temps.push(row.temp);
    if (isNum(row.precip)) bucket.precip.push(row.precip);
  }

  const decadal = [...decades.values()]
    .map((bucket) => ({
      decade: bucket.decade,
      label: `${bucket.decade}s`,
      temp: round(mean(bucket.temps), 2),
      precip: round(mean(bucket.precip), 0),
      anomaly:
        isNum(baselineTemp) && isNum(mean(bucket.temps))
          ? round(mean(bucket.temps) - baselineTemp, 2)
          : null,
    }))
    .sort((a, b) => a.decade - b.decade);

  const slopePerYear = linearSlope(withAnomaly.map((row) => ({ x: row.year, y: row.anomaly })));

  return {
    model,
    modelLabel: model.replace(/_/g, ' '),
    period: { start: START_YEAR, end: END_YEAR },
    baseline: {
      period: '1951–1980',
      tempMean: round(baselineTemp, 2),
      precipMean: round(baselinePrecip, 0),
    },
    recent: {
      period: '1995–2014',
      tempMean: round(recentTemp, 2),
      precipMean: round(recentPrecip, 0),
      anomaly: isNum(recentTemp) && isNum(baselineTemp) ? round(recentTemp - baselineTemp, 2) : null,
    },
    projected: {
      period: '2041–2050',
      tempMean: round(projectedTemp, 2),
      precipMean: round(projectedPrecip, 0),
      anomaly:
        isNum(projectedTemp) && isNum(baselineTemp) ? round(projectedTemp - baselineTemp, 2) : null,
      rainChangePct:
        isNum(projectedPrecip) && isNum(baselinePrecip) && baselinePrecip !== 0
          ? round(((projectedPrecip - baselinePrecip) / baselinePrecip) * 100, 1)
          : null,
    },
    warmingRatePerDecade: slopePerYear === null ? null : round(slopePerYear * 10, 2),
    annual: withAnomaly,
    decadal,
    source: {
      name: 'Open-Meteo Climate API',
      url: 'https://open-meteo.com/en/docs/climate-api',
      basis: 'Downscaled CMIP6 model simulation',
      model,
    },
    notes: [
      'This is a climate-model simulation, not a weather forecast. It shows long-term trends, not what will happen on a particular day.',
      'A single CMIP6 model is shown. Real climate projections combine several models and scenarios (SSP pathways) to express uncertainty.',
      'Open-Meteo downscales CMIP6 data for the selected coordinates; small differences from published national averages are expected.',
    ],
  };
}
