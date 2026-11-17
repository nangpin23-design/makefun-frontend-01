# Lantern — a fast make.fun board

[![make.fun](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/nangpin23-design/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/nangpin23-design/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01)

Lantern is a small, fast frontend for [make.fun](https://make.fun/bounty/makefun-frontend-01):
the bounty board, bounty pages, leaderboards and public profiles, read live from
make.fun's public API. Static files under `app/`, no build step — serve `app/` with any
static server and open `index.html`.

- Board (`#/`): every open bounty with its live pot, entry fee, time left and entries.
- Bounty page (`#/bounty/<slug>`): summary, description, rewards table with the live pot,
  dates and status.
- Leaderboard (`#/bounty/<slug>/leaderboard`): ranked entries with judge win rate and interval.
- Profile (`#/profile/<handle>`): record and entries of one account.

It reads only `https://make.fun/api` (GET), caches answers with ETags, pages long lists,
and updates countdowns in place. `main.ts` (Node 22, standard library only) copies
`app/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored library.
