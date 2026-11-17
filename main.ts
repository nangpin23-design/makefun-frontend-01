// Lantern — the entry program for makefun-frontend-01 (Node 22, standard library only).
// It hands the static frontend in: app/ and screenshots/ are copied from beside this file
// into the output directory, and dossier.json is written there with the vendored library.
// Nothing else in the repository is copied: README, LICENSE and the claim file stay out of
// the entry, and the program never reads the network or the clock, so two runs agree byte
// for byte. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output, so a local run
// looks like:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
  throw new Error('app/ is missing beside main.ts');
}

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps: text_max_bytes shapes the dossier text; the rest refuse an entry the
// scorer would refuse (more than 3 screenshots or one over 256 KiB; more than 993 files and
// directories in app/ or 16 MiB of app files).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
