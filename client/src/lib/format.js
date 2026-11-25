export function cx(...values) {
  return values.filter(Boolean).join(' ');
}

export function formatNumber(value, digits = 0, fallback = '—') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return fallback;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(Number(value));
}

export function formatTemp(value, fallback = '—') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return fallback;
  return `${Math.round(Number(value))}°`;
}

export function formatTime(iso) {
  if (!iso || typeof iso !== 'string') return '—';
  const time = iso.slice(11, 16);
  return time || '—';
}

export function formatHourLabel(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const hour = Number(iso.slice(11, 13));
  if (!Number.isFinite(hour)) return '';
  const suffix = hour >= 12 ? 'pm' : 'am';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

export function weekday(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', { weekday: 'short' });
}

export function weekdayLong(dateString) {
  if (!dateString) return '';
  const date = new Date(`${dateString.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', { weekday: 'long' });
}

export function formatDate(dateString, { withYear = false } = {}) {
  if (!dateString) return '';
  const date = new Date(`${dateString.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function dayLabel(dateString, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return weekday(dateString);
}

export function relativeTime(iso) {
  if (!iso) return 'just now';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'just now';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 90) return '1 min ago';
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 7200) return '1 hour ago';
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours ago`;
  return formatDate(new Date(then).toISOString());
}

export function titleCase(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/(^|\s|-)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}

export function percent(value, max = 100) {
  if (!Number.isFinite(Number(value)) || !Number.isFinite(Number(max)) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (Number(value) / Number(max)) * 100));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}
