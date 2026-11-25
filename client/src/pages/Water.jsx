import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CloudRain,
  Droplets,
  Factory,
  FlaskConical,
  Gauge,
  Heart,
  Layers,
  Leaf,
  Package,
  Recycle,
  ShieldCheck,
  Sprout,
  Thermometer,
  Trash2,
  Waves,
  Wrench,
} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import DataBadge from '../components/DataBadge.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { PageLoader } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatNumber } from '../lib/format.js';

const ICONS = {
  droplets: Droplets,
  factory: Factory,
  sprout: Sprout,
  trash: Trash2,
  layers: Layers,
  flower: Leaf,
  alert: AlertTriangle,
  thermometer: Thermometer,
  wrench: Wrench,
  shower: Droplets,
  'cloud-rain': CloudRain,
  recycle: Recycle,
  brush: Wrench,
  'heart-handshake': Heart,
  building: Building2,
  'trash-2': Trash2,
  trees: Leaf,
  activity: Activity,
  package: Package,
  gauge: Gauge,
};

function IconFor({ name, size = 20 }) {
  const Icon = ICONS[name] || Droplets;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}

function evaluate(indicator, value) {
  if (!Number.isFinite(Number(value))) return { tone: 'unknown', label: 'No value' };
  const numeric = Number(value);

  if (indicator.higherIsBetter) {
    if (numeric >= indicator.goodMin) return { tone: 'good', label: 'Meets guideline' };
    if (numeric >= indicator.goodMin * 0.6) return { tone: 'warn', label: 'Below guideline' };
    return { tone: 'bad', label: 'Poor' };
  }

  if (indicator.goodMin !== undefined && indicator.goodMax !== undefined) {
    if (numeric >= indicator.goodMin && numeric <= indicator.goodMax) {
      return { tone: 'good', label: 'Within range' };
    }
    return { tone: 'bad', label: 'Outside range' };
  }

  if (indicator.goodMax !== undefined) {
    if (numeric <= indicator.goodMax) return { tone: 'good', label: 'Meets guideline' };
    if (numeric <= indicator.goodMax * 1.5) return { tone: 'warn', label: 'Above guideline' };
    return { tone: 'bad', label: 'Well above guideline' };
  }

  return { tone: 'unknown', label: 'Informational' };
}

const TONE_LABEL = {
  good: 'Meets guideline',
  warn: 'Above guideline',
  bad: 'Well above guideline',
  unknown: 'No value',
};

export default function Water() {
  const { data, loading, error, refresh } = useApi('/content/water');
  const [riverIndex, setRiverIndex] = useState(0);

  if (loading && !data) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Water awareness"
          title="Water pollution awareness"
          description="Loading the educational content…"
        />
        <PageLoader label="Loading water content…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Water awareness" title="Water pollution awareness" />
        <ErrorState title="Could not load the water module" error={error} onRetry={refresh} />
      </div>
    );
  }

  const river = data.samples?.rivers?.[riverIndex] || null;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Water awareness"
        title={data.title}
        description={data.subtitle}
        meta={
          <>
            <DataBadge status="sample" label="Educational module" />
            <span className="meta-item">Updated {data.updated}</span>
          </>
        }
      />

      <div className="inline-warning">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>{data.dataStatus}</span>
      </div>

      <section className="fact-grid">
        {data.facts.map((fact) => (
          <article className="card fact-card" key={fact.label}>
            <strong>{fact.value}</strong>
            <span className="fact-label">{fact.label}</span>
            <p>{fact.detail}</p>
            <small>{fact.source}</small>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Where water pollution comes from</h2>
            <p className="card-subtitle">The main sources that degrade rivers, lakes and groundwater</p>
          </div>
          <Droplets size={19} aria-hidden="true" />
        </div>
        <div className="cause-grid">
          {data.causes.map((cause) => (
            <article className="cause-card" key={cause.title}>
              <span className="cause-icon" aria-hidden="true">
                <IconFor name={cause.icon} size={17} />
              </span>
              <div>
                <h3>{cause.title}</h3>
                <p>{cause.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Water-quality indicators</h2>
            <p className="card-subtitle">What each parameter tells us, and the guideline it is compared with</p>
          </div>
          <FlaskConical size={19} aria-hidden="true" />
        </div>
        <div className="indicator-table" role="table" aria-label="Water quality indicators">
          <div className="indicator-row indicator-head" role="row">
            <span role="columnheader">Indicator</span>
            <span role="columnheader">Guideline</span>
            <span role="columnheader">Why it matters</span>
          </div>
          {data.indicators.map((indicator) => (
            <div className="indicator-row" role="row" key={indicator.key}>
              <span role="cell" className="indicator-name">
                {indicator.label}
                {indicator.unit && <em>{indicator.unit}</em>}
              </span>
              <span role="cell" className="indicator-ideal">{indicator.ideal}</span>
              <span role="cell">
                {indicator.why}
                <small>{indicator.note}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card sample-card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Sample river demonstrations</h2>
            <p className="card-subtitle">Illustrative values for teaching — not real monitoring data</p>
          </div>
          <DataBadge status="sample" label={data.samples.label} />
        </div>

        <div className="sample-tabs" role="tablist" aria-label="Sample rivers">
          {data.samples.rivers.map((item, index) => (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={index === riverIndex}
              className={`sample-tab ${index === riverIndex ? 'is-active' : ''}`.trim()}
              onClick={() => setRiverIndex(index)}
            >
              {item.name}
            </button>
          ))}
        </div>

        {river && (
          <>
            <p className="sample-location">{river.location}</p>
            <div className="sample-grid">
              {data.indicators.map((indicator) => {
                const value = river.values[indicator.key];
                const verdict = evaluate(indicator, value);
                return (
                  <article className={`sample-param ${verdict.tone}`} key={indicator.key}>
                    <span className="sample-param-label">{indicator.label}</span>
                    <strong>
                      {formatNumber(value, indicator.key === 'ph' ? 1 : 0)}
                      {indicator.unit && <em>{indicator.unit}</em>}
                    </strong>
                    <span className="sample-param-verdict">
                      {verdict.tone === 'good' ? 'Meets' : verdict.tone === 'warn' ? 'Above' : verdict.tone === 'bad' ? 'High' : '—'}
                    </span>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <div className="sample-disclaimer">
          <AlertTriangle size={15} aria-hidden="true" />
          <span>{data.samples.disclaimer}</span>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">What polluted water does</h2>
            <p className="card-subtitle">Effects on ecosystems, people and the services water provides</p>
          </div>
          <Waves size={19} aria-hidden="true" />
        </div>
        <div className="effect-grid">
          <div>
            <h3>Aquatic life</h3>
            <ul className="bullet-list">
              {data.effects.aquatic.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Human health</h3>
            <ul className="bullet-list">
              {data.effects.human.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Ecosystems</h3>
            <ul className="bullet-list">
              {data.effects.ecosystems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="two-col-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">What you can do</h2>
              <p className="card-subtitle">Everyday conservation habits</p>
            </div>
            <Droplets size={18} aria-hidden="true" />
          </div>
          <div className="action-list">
            {data.conservation.map((item) => (
              <div className="action-row" key={item.title}>
                <span className="action-icon" aria-hidden="true">
                  <IconFor name={item.icon} size={16} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">What society can do</h2>
              <p className="card-subtitle">Prevention at the source</p>
            </div>
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <div className="action-list">
            {data.prevention.map((item) => (
              <div className="action-row" key={item.title}>
                <span className="action-icon" aria-hidden="true">
                  <IconFor name={item.icon} size={16} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Standards and frameworks</h2>
            <p className="card-subtitle">The rules that define acceptable water quality in India</p>
          </div>
        </div>
        <div className="standard-grid">
          {data.standards.map((standard) => (
            <article className="standard-card" key={standard.name}>
              <h3>{standard.name}</h3>
              <p>{standard.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <SourceNote
        className="page-source-note"
        sources={data.references.map((reference) => ({ name: reference.label, url: reference.url }))}
      >
        Water quality depends on where, when and how a sample is collected. This module is
        educational: no live water-quality feed is connected, and the sample values shown above are
        illustrative only. Do not cite them as real measurements.
      </SourceNote>
    </div>
  );
}
