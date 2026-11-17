// Lantern's router: four hash routes, one view. The board and the bounty page load with
// the first page; the leaderboard and the profile arrive later, by a literal import() when
// their route opens, so the first load stays small. window.__shotReady is false while a
// route loads and true once its data is on screen, so a screenshot script knows when to
// capture. A 30-second ticker refreshes every countdown in place, without refetching.

import { renderBoard } from './board.js';
import { renderBounty } from './bounty.js';
import { timeLeft } from './format.js';

const view = document.getElementById('view');
let ticking = false;

function showError(error, retry) {
  view.innerHTML = `<div class="error"><strong>Could not load this view.</strong>
    <p>${error && error.message ? error.message : 'The request failed.'}</p>
    <button id="retry" type="button">Retry</button></div>`;
  const btn = document.getElementById('retry');
  if (btn) btn.addEventListener('click', retry);
  window.__shotReady = true;
}

function route() {
  const hash = window.location.hash || '#/';
  const parts = hash.replace(/^#\//, '').split('/').filter(Boolean);
  return parts;
}

async function render() {
  window.__shotReady = false;
  const parts = route();
  try {
    if (parts.length === 0) {
      await renderBoard(view);
    } else if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') {
      const { renderLeaderboard } = await import('./leaderboard.js');
      await renderLeaderboard(view, decodeURIComponent(parts[1]));
    } else if (parts[0] === 'bounty' && parts[1]) {
      await renderBounty(view, decodeURIComponent(parts[1]));
    } else if (parts[0] === 'profile' && parts[1]) {
      const { renderProfile } = await import('./profile.js');
      await renderProfile(view, decodeURIComponent(parts[1]));
    } else {
      await renderBoard(view);
    }
  } catch (error) {
    showError(error, render);
    return;
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function tick() {
  document.querySelectorAll('[data-deadline]').forEach((el) => {
    const next = timeLeft(el.getAttribute('data-deadline'));
    if (el.textContent !== next) el.textContent = next;
  });
}

if (!ticking) {
  ticking = true;
  setInterval(tick, 30000);
}

window.addEventListener('hashchange', render);
render();
