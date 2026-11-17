// One bounty's page: its summary, description and rules, the rewards table with the live
// pot, its dates and its status. The rewards table reads rewardsNow, the live amounts the
// API returns per place (base prize plus the entry fees' share), and falls back to the plain
// rewards table when the live one is absent.

import { getBounty } from './api.js';
import { date, esc, money, plural, timeLeft } from './format.js';

function takesEntries(b) {
  return new Date(b.deadline).getTime() > Date.now();
}

function statusOf(b) {
  if (b.status === 'resolved' || b.winner) return ['ended', 'Resolved'];
  if (!takesEntries(b)) return ['ended', 'Closed — results pending'];
  const ms = new Date(b.deadline).getTime() - Date.now();
  if (ms <= 86400000) return ['soon', 'Closing soon'];
  return ['open', 'Open for entries'];
}

function rewardRows(b) {
  const live = Array.isArray(b.rewardsNow) ? b.rewardsNow : null;
  if (live && live.length) {
    return live.map((r) => `<tr>
      <td class="num">${r.place}${Number(r.place) === 1 ? 'st' : Number(r.place) === 2 ? 'nd' : Number(r.place) === 3 ? 'rd' : 'th'}</td>
      <td class="num"><strong>${money(r.amountUsd)}</strong></td>
      <td class="num muted">${money(r.baseUsd)} prize + ${money(r.feeShareUsd)} fees</td>
    </tr>`).join('');
  }
  const table = b.rewards || {};
  return Object.keys(table).sort((a, b) => Number(a) - Number(b)).map((place) => `<tr>
    <td class="num">${place}</td>
    <td class="num"><strong>${money(table[place])}</strong></td>
    <td class="num muted">—</td>
  </tr>`).join('');
}

function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export async function renderBounty(view, slug) {
  const b = await getBounty(slug);
  const [cls, label] = statusOf(b);
  const fee = b.entryFeeUsd ? money(b.entryFeeUsd) : 'No entry fee';
  const feeNote = b.entryFeePayers ? ` · ${b.entryFeePayers} paid` : '';
  const criteria = (b.resolution && b.resolution.criteria) || [];
  document.title = `${b.title} | Lantern`;
  view.innerHTML = `
    <p class="small"><a href="#/">← All bounties</a></p>
    <h1>${esc(b.title)}</h1>
    <p>${esc(b.summary || '')}</p>
    <p><span class="badge ${cls}">${label}</span>
      <span class="muted small"> ${esc(b.category || '')} · ${esc(b.slug)}</span></p>
    <dl class="facts">
      <div class="fact"><dt>Live pot</dt><dd>${money(b.potUsd ?? b.rewardAmount)}</dd></div>
      <div class="fact"><dt>Entry fee</dt><dd>${fee}<small>${feeNote}</small></dd></div>
      <div class="fact"><dt>Deadline</dt><dd><small><span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span> · ${date(b.deadline)}</small></dd></div>
      <div class="fact"><dt>Entries</dt><dd>${Number(b.submissionCount) || 0}</dd></div>
      <div class="fact"><dt>Opens</dt><dd><small>${date(b.opensAt)}</small></dd></div>
    </dl>
    <p><a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard →</a></p>
    <h2>Rewards</h2>
    <table>
      <thead><tr><th class="num">Place</th><th class="num">Wins now</th><th class="num">Split</th></tr></thead>
      <tbody>${rewardRows(b)}</tbody>
    </table>
    <p class="muted small">Live amounts: the base prize plus this place's share of the entry fees paid so far.</p>
    <h2>Description</h2>
    <div class="desc">${paragraphs(b.description)}</div>
    ${criteria.length ? `<h2>How it is judged</h2>
    <div class="desc"><p>${esc(b.resolution.summary || '')}</p>
    <ol>${criteria.slice(0, 4).map((c) => `<li>${esc(c)}</li>`).join('')}</ol></div>` : ''}
    <p class="muted small">${plural(b.submissionCount, 'entry', 'entries')} so far · ${esc(b.url || '')}</p>`;
}
