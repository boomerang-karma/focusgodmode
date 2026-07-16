/**
 * Smoke test for full suite modules + content.
 * Run: node scripts/smoke-drills.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed += 1;
  } else {
    console.log('OK  :', msg);
  }
}

const words = JSON.parse(readFileSync(join(root, 'assets/content/words-en.json'), 'utf8'));
const samasya = JSON.parse(readFileSync(join(root, 'assets/content/samasya-prompts.json'), 'utf8'));
const verses = JSON.parse(readFileSync(join(root, 'assets/content/verses.json'), 'utf8'));
const quiz = JSON.parse(readFileSync(join(root, 'assets/content/purana-quiz.json'), 'utf8'));

assert(words.words.length >= 50, `word pack ${words.words.length}`);
assert(samasya.items.length >= 8, `samasya ${samasya.items.length}`);
assert(verses.items.length >= 4, `verses ${verses.items.length}`);
assert(quiz.items.length >= 10, `quiz ${quiz.items.length}`);

const modules = [
  'src/modules/core/drill.ts',
  'src/modules/session/orchestrator.ts',
  'src/modules/tracking/metrics.ts',
  'src/modules/srs/repository.ts',
  'src/modules/drills/vyasta-recall.ts',
  'src/modules/drills/digit-span.ts',
  'src/modules/drills/ghanta-ganana.ts',
  'src/modules/drills/dual-n-back.ts',
  'src/modules/drills/samasya-purti.ts',
  'src/modules/drills/nishedhakshari.ts',
  'src/modules/drills/datta-padi.ts',
  'src/modules/drills/ashu-kavitva.ts',
  'src/modules/drills/aprastuta-prasanga.ts',
  'src/modules/drills/puranapathana.ts',
  'src/modules/drills/schulte.ts',
  'src/modules/drills/stroop.ts',
  'src/modules/drills/task-switch.ts',
  'src/modules/drills/arithmetic-load.ts',
  'src/modules/drills/verse-recall.ts',
  'app/(tabs)/srs.tsx',
  'app/practice/builder.tsx',
];

for (const m of modules) {
  assert(existsSync(join(root, m)), m);
}

// All drills registered in index
const indexSrc = readFileSync(join(root, 'src/modules/drills/index.ts'), 'utf8');
const expectedDrills = [
  'vyastaRecallDrill',
  'digitSpanDrill',
  'ghantaGananaDrill',
  'dualNBackDrill',
  'samasyaPurtiDrill',
  'verseRecallDrill',
  'nishedhakshariDrill',
  'dattaPadiDrill',
  'ashuKavitvaDrill',
  'aprastutaPrasangaDrill',
  'puranapathanaDrill',
  'schulteDrill',
  'stroopDrill',
  'taskSwitchDrill',
  'arithmeticLoadDrill',
];
for (const d of expectedDrills) {
  assert(indexSrc.includes(`registerDrill(${d})`), `registered ${d}`);
}
assert(expectedDrills.length === 15, '15 drills');

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nFull-suite smoke checks passed.');
