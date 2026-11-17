// The bounty board: every open bounty with its live pot, entry fee, time left and entries.
// The board is one cached request; filtering, sorting and paging all happen here, in the
// browser, so switching views costs no new request. A bounty past its deadline may still
// read status open, so whether it takes entries is decided by its deadline, not its status.

import { getBoard } from './api.js';
import { esc, money, timeLeft } from './format.js';

const PAGE_SIZE = 25;

let items = null;
let filter = 'all';
let sort = 'closing';
let page = 0;

function takesEntries(b) {
  return new Date(b.deadline).getTime() > Date.now();
}

function closingSoon(b) {
  const ms = new Date(b.deadline).getTime() - Date.now();
  return ms > 0 && ms <= 86400000;
}

function statusOf(b) {
  if (!takesEntries(b)) return ['ended', 'Ended'];
  if (closingSoon(b)) return ['soon', 'Closing soon'];
  return ['open', 'Open'];
}

function visible() {
  let list = items.slice();
  if (filter === 'open') list = list.filter(takesEntries);
  if (filter === 'soon') list = list.filter(closingSoon);
  if (filter === 'ended') list = list.filter((b) => !takesEntries(b));
  if (sort === 'closing') {
    // Still open, soonest deadline first; ended ones after, most recently ended first.
    list.sort((a, b) => {
      const ao = takesEntries(a) ? 0 : 1;
      const bo = takesEntries(b) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      const d = new Date(a.deadline) - new Date(b.deadline);
      return ao === 0 ? d : -d;
    });
  } else if (sort === 'pot') {
    list.sort((a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount));
  } else if (sort === 'entries') {
    list.sort((a, b) => Number(b.submissionCount) - Number(a.submissionCount));
  }
  return list;
}

function row(b) {
  const [cls, label] = statusOf(b);
  const fee = b.entryFeeUsd ? money(b.entryFeeUsd) : '—';
  return `<tr>
    <td><a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a><br>
      <span class="muted small">${esc(b.category || '')} · ${esc(b.slug)}</span></td>
    <td class="num"><strong>${money(b.potUsd ?? b.rewardAmount)}</strong></td>
    <td class="num">${fee}</td>
    <td><span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span></td>
    <td class="num">${Number(b.submissionCount) || 0}</td>
    <td><span class="badge ${cls}">${label}</span></td>
  </tr>`;
}

export async function renderBoard(view) {
  if (!items) items = (await getBoard()).items || [];
  const open = items.filter(takesEntries);
  const pot = open.reduce((sum, b) => sum + Number(b.potUsd ?? b.rewardAmount ?? 0), 0);
  const entries = open.reduce((sum, b) => sum + (Number(b.submissionCount) || 0), 0);
  const list = visible();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if (page >= pages) page = pages - 1;
  const slice = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const counts = {
    all: items.length,
    open: open.length,
    soon: items.filter(closingSoon).length,
    ended: items.length - open.length,
  };
  const chip = (key, label) =>
    `<button class="chip" data-filter="${key}" aria-pressed="${filter === key}">${label} (${counts[key]})</button>`;
  view.innerHTML = `
    <h1>Open bounties</h1>
    <p class="muted">Live from make.fun — pots include entry fees paid in. A bounty counts as open
    while its deadline is still ahead, whatever its status reads.</p>
    <div class="stats">
      <div class="stat"><b>${open.length}</b><span>open for entries</span></div>
      <div class="stat"><b>${money(pot)}</b><span>live pots, open</span></div>
      <div class="stat"><b>${entries.toLocaleString('en-US')}</b><span>entries so far</span></div>
    </div>
    <div class="chips">
      ${chip('all', 'All')}${chip('open', 'Open')}${chip('soon', 'Closing soon')}${chip('ended', 'Ended')}
      <label class="small muted" style="margin-left:auto;align-self:center">Sort
        <select id="sort" aria-label="Sort bounties">
          <option value="closing"${sort === 'closing' ? ' selected' : ''}>Closing soon</option>
          <option value="pot"${sort === 'pot' ? ' selected' : ''}>Biggest pot</option>
          <option value="entries"${sort === 'entries' ? ' selected' : ''}>Most entries</option>
        </select>
      </label>
    </div>
    <table>
      <thead><tr><th>Bounty</th><th class="num">Live pot</th><th class="num">Entry fee</th><th>Time left</th><th class="num">Entries</th><th>Status</th></tr></thead>
      <tbody>${slice.map(row).join('') || '<tr><td colspan="6" class="muted">Nothing matches this filter.</td></tr>'}</tbody>
    </table>
    ${pages > 1 ? `<div class="pager">
      <button id="prev" ${page === 0 ? 'disabled' : ''}>← Newer</button>
      <span class="small muted">Page ${page + 1} of ${pages}</span>
      <button id="next" ${page === pages - 1 ? 'disabled' : ''}>Older →</button>
    </div>` : ''}`;
  view.querySelectorAll('[data-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      filter = el.dataset.filter;
      page = 0;
      renderBoard(view);
    });
  });
  const sortEl = view.querySelector('#sort');
  if (sortEl) {
    sortEl.addEventListener('change', () => {
      sort = sortEl.value;
      page = 0;
      renderBoard(view);
    });
  }
  const prev = view.querySelector('#prev');
  if (prev) prev.addEventListener('click', () => { page -= 1; renderBoard(view); });
  const next = view.querySelector('#next');
  if (next) next.addEventListener('click', () => { page += 1; renderBoard(view); });
}
