import { useMemo, useState } from 'react';
import {
  Calendar,
  FilePlus2,
  FileText,
  MapPin,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import PageHeader from '../components/PageHeader.jsx';
import DataBadge from '../components/DataBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SourceNote from '../components/SourceNote.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { SkeletonCard } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { api, locationParams } from '../lib/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatNumber, relativeTime, titleCase } from '../lib/format.js';

const KINDS = ['weather', 'air', 'risk', 'analysis', 'climate', 'custom'];

function SaveDialog({ open, onClose, onSaved, env, location }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('weather');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Give the report a title so you can find it later.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = env
        ? {
            weather: {
              current: env.weather?.current,
              daily: env.weather?.daily?.slice(0, 3),
            },
            air: {
              aqi: env.air?.aqi,
              current: env.air?.current,
            },
            risk: env.risk,
            alerts: env.alerts,
          }
        : {};
      await api.post('/reports', {
        title: title.trim(),
        kind,
        location,
        summary: env?.risk?.summary || '',
        notes: notes.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        payload,
      });
      onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'The report could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-report-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-head">
          <div>
            <h2 id="save-report-title">Save a report</h2>
            <p>Snapshot the current conditions for your EVS write-up.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={17} />
          </button>
        </div>

        <form className="dialog-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={`${location.name} conditions, ${formatDate(new Date().toISOString())}`}
              autoFocus
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Kind</span>
              <select value={kind} onChange={(event) => setKind(event.target.value)}>
                {KINDS.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Tags (comma separated)</span>
              <input
                type="text"
                value={tags}
                maxLength={180}
                onChange={(event) => setTags(event.target.value)}
                placeholder="pune, aqi, monsoon"
              />
            </label>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={3}
              value={notes}
              maxLength={2000}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Why are you saving this? What did you observe?"
            />
          </label>

          <div className="dialog-preview">
            <span>Snapshot preview</span>
            {env ? (
              <ul>
                <li>
                  Weather: {formatNumber(env.weather?.current?.temperature, 1)} °C ·{' '}
                  {env.weather?.current?.condition?.label}
                </li>
                <li>
                  Air: {env.air?.aqi ? `AQI ${env.air.aqi.value} (${env.air.aqi.category})` : 'unavailable'}
                </li>
                <li>
                  Risk: {env.risk ? `${env.risk.score}/100 · ${env.risk.level}` : 'unavailable'}
                </li>
              </ul>
            ) : (
              <p>The live snapshot is still loading. The report will be saved without weather data.</p>
            )}
          </div>

          {error && <p className="dialog-error">{error}</p>}

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={15} />
              {saving ? 'Saving…' : 'Save report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Reports() {
  const { location } = useLocation();
  const { notify } = useToast();
  const { data, loading, error, refresh } = useApi('/reports');
  const env = useApi(`/environment?${locationParams(location)}`);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null);

  const reports = data?.reports || [];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reports.filter((report) => {
      if (kindFilter !== 'all' && report.kind !== kindFilter) return false;
      if (!term) return true;
      return (
        report.title.toLowerCase().includes(term) ||
        (report.summary || '').toLowerCase().includes(term) ||
        (report.notes || '').toLowerCase().includes(term) ||
        (report.tags || []).some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [reports, query, kindFilter]);

  async function remove(report) {
    if (!window.confirm(`Delete “${report.title}”? This cannot be undone.`)) return;
    setBusyId(report.id);
    try {
      await api.del(`/reports/${report.id}`);
      notify('Report deleted.', 'success');
      refresh();
      if (detail?.id === report.id) setDetail(null);
    } catch (requestError) {
      notify(requestError.message || 'The report could not be deleted.', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Saved reports"
        title="Saved reports"
        description="Save a snapshot of conditions for your EVS journal, compare days, and keep a record of what the data said."
        meta={
          <>
            <DataBadge status="live" label={`${reports.length} saved`} />
            <span className="meta-item">Stored in MongoDB Atlas when configured, otherwise a local JSON file</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-outline" onClick={refresh} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setDialogOpen(true)}>
              <FilePlus2 size={16} />
              Save snapshot
            </button>
          </>
        }
      />

      <div className="reports-toolbar">
        <div className="reports-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, notes or tags"
            aria-label="Search saved reports"
          />
        </div>
        <div className="reports-filters" role="group" aria-label="Filter by kind">
          <button
            type="button"
            className={kindFilter === 'all' ? 'is-active' : ''}
            onClick={() => setKindFilter('all')}
          >
            All
          </button>
          {KINDS.map((kind) => (
            <button
              type="button"
              key={kind}
              className={kindFilter === kind ? 'is-active' : ''}
              onClick={() => setKindFilter(kind)}
            >
              {titleCase(kind)}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="report-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} height={180} lines={3} />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Could not load saved reports" error={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={reports.length ? 'No reports match this filter' : 'No saved reports yet'}
          description={
            reports.length
              ? 'Try a different search term or kind.'
              : 'Save a snapshot from the dashboard, weather, air or risk pages to build a record for your project.'
          }
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setDialogOpen(true)}>
              <FilePlus2 size={15} />
              Save your first snapshot
            </button>
          }
        />
      ) : (
        <div className="report-grid">
          {filtered.map((report) => (
            <article className="card report-card" key={report.id}>
              <div className="report-card-head">
                <span className={`report-kind kind-${report.kind}`}>{titleCase(report.kind)}</span>
                <span className="report-date">{relativeTime(report.createdAt)}</span>
              </div>
              <h2>{report.title}</h2>
              {report.location && (
                <p className="report-location">
                  <MapPin size={13} aria-hidden="true" />
                  {[report.location.name, report.location.admin1, report.location.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {report.summary && <p className="report-summary">{report.summary}</p>}
              {report.tags?.length > 0 && (
                <div className="report-tags">
                  {report.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
              <div className="report-foot">
                <span>
                  <Calendar size={12} aria-hidden="true" />
                  {formatDate(report.createdAt, { withYear: true })}
                </span>
                <div className="report-actions">
                  <button type="button" className="text-link" onClick={() => setDetail(report)}>
                    View
                  </button>
                  <button
                    type="button"
                    className="report-delete"
                    onClick={() => remove(report)}
                    disabled={busyId === report.id}
                    aria-label={`Delete ${report.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <SourceNote className="page-source-note">
        Reports contain the weather, air-quality and risk values that were current when you saved
        them. They are snapshots of model data, not official measurements, and they do not update
        when the forecast changes.
      </SourceNote>

      <SaveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          notify('Report saved.', 'success');
          refresh();
        }}
        env={env.data}
        location={location}
      />

      {detail && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setDetail(null)}>
          <div
            className="dialog dialog-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-head">
              <div>
                <span className={`report-kind kind-${detail.kind}`}>{titleCase(detail.kind)}</span>
                <h2 id="report-detail-title">{detail.title}</h2>
                <p>
                  Saved {formatDate(detail.createdAt, { withYear: true })} ·{' '}
                  {detail.location?.name || 'No location'}
                </p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setDetail(null)} aria-label="Close">
                <X size={17} />
              </button>
            </div>

            {detail.notes && (
              <div className="report-detail-block">
                <span>Notes</span>
                <p>{detail.notes}</p>
              </div>
            )}

            {detail.payload?.weather?.current && (
              <div className="report-detail-block">
                <span>Weather snapshot</span>
                <p>
                  {formatNumber(detail.payload.weather.current.temperature, 1)} °C ·{' '}
                  {detail.payload.weather.current.condition?.label} · humidity{' '}
                  {formatNumber(detail.payload.weather.current.humidity, 0)}% · wind{' '}
                  {formatNumber(detail.payload.weather.current.windSpeed, 0)} km/h
                </p>
              </div>
            )}

            {detail.payload?.air?.aqi && (
              <div className="report-detail-block">
                <span>Air-quality snapshot</span>
                <p>
                  Estimated AQI {detail.payload.air.aqi.value} ({detail.payload.air.aqi.category}) ·
                  dominant {detail.payload.air.aqi.dominantLabel}
                </p>
              </div>
            )}

            {detail.payload?.risk && (
              <div className="report-detail-block">
                <span>Risk snapshot</span>
                <p>
                  {detail.payload.risk.score}/100 · {detail.payload.risk.level} —{' '}
                  {detail.payload.risk.summary}
                </p>
              </div>
            )}

            {detail.payload?.alerts?.length > 0 && (
              <div className="report-detail-block">
                <span>Advisories at save time</span>
                <ul className="bullet-list compact">
                  {detail.payload.alerts.map((alert) => (
                    <li key={alert.id}>
                      {alert.severityLabel}: {alert.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(detail, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `weathergpt-${detail.id}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download JSON
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
