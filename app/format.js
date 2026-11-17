// Small formatting helpers: every value the views show passes through one of these, so
// numbers, money and dates look the same on every surface.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/** A dollar amount as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** An ISO date as a short UTC date + time. */
export function date(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

/** Milliseconds until a deadline, as '2d 4h left', '35m left', or 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  if (mins > 0) return `${mins}m left`;
  return 'seconds left';
}

/** A judge win rate stored in millionths (973639) as '97.4%'. */
export function rate(micro) {
  const n = Number(micro);
  if (!Number.isFinite(n)) return '—';
  return `${(n / 10000).toFixed(1)}%`;
}

/** A byte count as '703 KB' or '2.1 MB'. */
export function bytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (v < 1024) return `${v} B`;
  if (v < 1048576) return `${(v / 1024).toFixed(0)} KB`;
  return `${(v / 1048576).toFixed(1)} MB`;
}

/** '1 entry' / '12 entries'. */
export function plural(n, one, many) {
  return `${Number(n) || 0} ${Number(n) === 1 ? one : many}`;
}
