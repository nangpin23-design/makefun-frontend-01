// Lantern's only way to talk to make.fun: read-only GETs against the public API, with an
// ETag cache. make.fun binds each ETag to the minute, so a revalidation inside the same
// minute answers 304 and costs no download; a new minute re-downloads. Nothing here writes,
// signs in, or touches any other origin.

const BASE = 'https://make.fun/api';

// url -> { etag, body, at } of the last good answer, plus in-flight requests keyed by url.
const cache = new Map();
const flying = new Map();

export async function fetchJson(path) {
  const url = BASE + path;
  const held = cache.get(url);
  const headers = {};
  if (held && held.etag) headers['If-None-Match'] = held.etag;
  const pending = flying.get(url);
  if (pending) return pending;
  const run = fetch(url, { headers }).then(async (res) => {
    if (res.status === 304 && held) return held.body;
    if (!res.ok) throw new Error(`make.fun answered ${res.status} for ${path}`);
    const body = await res.json();
    cache.set(url, { etag: res.headers.get('etag'), body, at: Date.now() });
    return body;
  }).finally(() => {
    if (flying.get(url) === run) flying.delete(url);
  });
  flying.set(url, run);
  return run;
}

/** The board: open bounties, without the per-bounty activity a board never shows. */
export function getBoard() {
  return fetchJson('/competitions?status=open&activity=times');
}

/** One bounty, by slug. */
export function getBounty(slug) {
  return fetchJson(`/competitions/${encodeURIComponent(slug)}`);
}

/**
 * A bounty's leaderboard. rows=first returns the top 10 in full plus the rest of the field
 * in slim form (rank, handle, title, win rate, interval) — a few hundred kilobytes instead
 * of the whole field in full, which runs to tens of megabytes on the big bounties.
 */
export function getLeaderboard(slug) {
  return fetchJson(`/competitions/${encodeURIComponent(slug)}/leaderboard?rows=first`);
}

/** An account's public profile, by handle. */
export function getProfile(handle) {
  return fetchJson(`/profiles/${encodeURIComponent(handle)}`);
}
