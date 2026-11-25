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

      <SourceNote
        className="page-source-note"
        sources={[
          { name: 'CPCB water quality standards', url: 'https://cpcb.nic.in/' },
          { name: 'Bureau of Indian Standards (IS 10500)', url: 'https://www.services.bis.gov.in/' },
        ]}
      >
        {data.disclaimer}
      </SourceNote>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Water-quality indicators & standards</h2>
            <p className="card-subtitle">Key parameters, allowable limits and what they measure</p>
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

      <div className="two-col-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Everyday water conservation</h2>
              <p className="card-subtitle">Practical steps to reduce consumption</p>
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
              <h2 className="card-title">Standards and frameworks</h2>
              <p className="card-subtitle">The rules that define acceptable water quality in India</p>
            </div>
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <div className="action-list">
            {data.standards.map((standard) => (
              <div className="action-row" key={standard.name}>
                <div>
                  <strong>{standard.name}</strong>
                  <p>{standard.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

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
