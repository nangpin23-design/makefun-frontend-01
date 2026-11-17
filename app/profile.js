// An account's public profile: who they are, their record across competitions, and every
// entry they have submitted. Avatar images come from make.fun's own answers and send a
// same-origin resource policy, so the img carries crossorigin="anonymous" before its src.

import { getProfile } from './api.js';
import { date, esc, money, plural } from './format.js';

export async function renderProfile(view, handle) {
  const p = await getProfile(handle);
  const record = p.record || {};
  const solutions = p.solutions || [];
  const name = p.display_name || p.handle;
  const pic = p.avatar || p.image;
  document.title = `${name} (@${p.handle}) | Lantern`;
  view.innerHTML = `
    <p class="small"><a href="#/">← Board</a></p>
    <div class="profile-head">
      <div class="avatar">${pic
        ? `<img crossorigin="anonymous" src="${esc(pic)}" alt="">`
        : esc((name || '?').slice(0, 1).toUpperCase())}</div>
      <div>
        <h1 style="margin:0">${esc(name)}</h1>
        <p class="muted" style="margin:2px 0">@${esc(p.handle)} · joined ${date(p.joined_at)}</p>
        ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
        <p class="small muted">${[
          p.x ? `X @${esc(p.x)}` : '',
          p.github_login ? `GitHub ${esc(p.github_login)}` : '',
          p.discord ? `Discord ${esc(p.discord)}` : '',
          p.wallet && p.wallet.address ? `Wallet ${esc(p.wallet.address.slice(0, 4))}…${esc(p.wallet.address.slice(-4))}` : '',
        ].filter(Boolean).join(' · ')}</p>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><b>${record.competitions_entered || 0}</b><span>entered</span></div>
      <div class="stat"><b>${record.competitions_placed || 0}</b><span>placed</span></div>
      <div class="stat"><b>${record.competitions_won || 0}</b><span>won</span></div>
      <div class="stat"><b>${money(record.prize_usd || 0)}</b><span>prize money</span></div>
    </div>
    <h2>Entries (${solutions.length})</h2>
    ${solutions.length ? `<table>
      <thead><tr><th>Bounty</th><th>Entry</th><th class="num">Place</th><th class="num">Prize</th></tr></thead>
      <tbody>${solutions.map((s) => `<tr>
        <td><a href="#/bounty/${encodeURIComponent(s.competition.slug)}">${esc(s.competition.title)}</a><br>
          <span class="muted small">${date(s.competition.deadline)}</span></td>
        <td>${esc(s.title || '')}</td>
        <td class="num">${s.placement == null ? '—' : `#${s.placement}`}</td>
        <td class="num">${s.prize_usd == null ? '—' : money(s.prize_usd)}</td>
      </tr>`).join('')}</tbody>
    </table>` : `<p class="muted">No entries yet.</p>`}
    <p class="muted small">${plural(record.competitions_entered, 'competition', 'competitions')} entered · best placement ${record.best_placement == null ? '—' : `#${record.best_placement}`}</p>`;
}
