// A bounty's leaderboard: the ranked entries with their judge win rate and interval.
// The API returns the top 10 in full and the rest of the field in slim form; this view
// merges the two into one ranked list and pages it 25 rows at a time, so a 7,000-entry
// field never asks the browser to paint 7,000 rows.

import { getLeaderboard } from './api.js';
import { bytes, esc, plural, rate } from './format.js';

const PAGE_SIZE = 25;

function normalize(entry, slim) {
  if (slim) {
    return {
      rank: entry.rank,
      handle: entry.handle,
      title: entry.title,
      rate: entry.value,
      low: entry.interval ? entry.interval.low : null,
      high: entry.interval ? entry.interval.high : null,
      size: null,
      valid: null,
      prize: entry.prize_rank,
    };
  }
  const v = entry.values || {};
  return {
    rank: entry.rank,
    handle: entry.handle,
    title: entry.title,
    rate: v.judge,
    low: v.judge_low,
    high: v.judge_high,
    size: v.bytes,
    valid: v.valid,
    prize: entry.prize_rank,
  };
}

export async function renderLeaderboard(view, slug) {
  const data = await getLeaderboard(slug);
  const rows = (data.entries || []).map((e) => normalize(e, false))
    .concat((data.rest || []).map((e) => normalize(e, true)));
  rows.sort((a, b) => (a.rank || 0) - (b.rank || 0));
  const total = rows.length;
  let page = 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const comp = data.competition || {};
  const phase = data.phase || {};
  document.title = `Leaderboard — ${comp.title || slug} | Lantern`;

  function paint() {
    const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    view.innerHTML = `
      <p class="small"><a href="#/bounty/${encodeURIComponent(slug)}">← ${esc(comp.title || slug)}</a></p>
      <h1>Leaderboard</h1>
      <p class="muted">${esc(phase.title || '')} · ${plural(total, 'entry', 'entries')} ranked by judge win rate
        ${data.metrics_withheld ? '· some build metrics are withheld' : ''}</p>
      <table>
        <thead><tr><th class="num">#</th><th>Entrant</th><th>Entry</th><th class="num">Win rate</th><th class="num">90% interval</th><th class="num">Size</th><th class="num">Valid</th></tr></thead>
        <tbody>${slice.map((r) => `<tr>
          <td class="num">${r.rank || '—'}</td>
          <td><span style="white-space:nowrap"><a href="#/profile/${encodeURIComponent(r.handle || '')}">${esc(r.handle || '—')}</a>${r.prize ? ` <span class="badge soon">P${r.prize}</span>` : ''}</span></td>
          <td>${esc(r.title || '')}</td>
          <td class="num"><strong>${rate(r.rate)}</strong></td>
          <td class="num muted">${rate(r.low)} – ${rate(r.high)}</td>
          <td class="num">${r.size == null ? '—' : bytes(r.size)}</td>
          <td class="num">${r.valid == null ? '—' : r.valid ? '✓' : '✗'}</td>
        </tr>`).join('') || '<tr><td colspan="7" class="muted">No entries yet.</td></tr>'}</tbody>
      </table>
      ${pages > 1 ? `<div class="pager">
        <button id="prev" ${page === 0 ? 'disabled' : ''}>← Newer</button>
        <span class="small muted">Page ${page + 1} of ${pages} · rows ${page * PAGE_SIZE + 1}–${Math.min(total, (page + 1) * PAGE_SIZE)} of ${total}</span>
        <button id="next" ${page === pages - 1 ? 'disabled' : ''}>Older →</button>
      </div>` : ''}`;
    const prev = view.querySelector('#prev');
    if (prev) prev.addEventListener('click', () => { page -= 1; paint(); });
    const next = view.querySelector('#next');
    if (next) next.addEventListener('click', () => { page += 1; paint(); });
  }
  paint();
}
