/**
 * Drill plugins — register all drills here.
 * To add a drill: implement Drill, export it, call registerDrill once.
 */

import { registerDrill } from '../core';
import { vyastaRecallDrill } from './vyasta-recall';
import { digitSpanDrill } from './digit-span';
import { ghantaGananaDrill } from './ghanta-ganana';
import { dualNBackDrill } from './dual-n-back';
import { samasyaPurtiDrill } from './samasya-purti';
import { nishedhakshariDrill } from './nishedhakshari';
import { dattaPadiDrill } from './datta-padi';
import { ashuKavitvaDrill } from './ashu-kavitva';
import { aprastutaPrasangaDrill } from './aprastuta-prasanga';
import { puranapathanaDrill } from './puranapathana';
import { schulteDrill } from './schulte';
import { stroopDrill } from './stroop';
import { taskSwitchDrill } from './task-switch';
import { arithmeticLoadDrill } from './arithmetic-load';
import { verseRecallDrill } from './verse-recall';

let registered = false;

export function registerAllDrills(): void {
  if (registered) return;

  // Phase 1
  registerDrill(vyastaRecallDrill);
  registerDrill(digitSpanDrill);
  registerDrill(ghantaGananaDrill);
  registerDrill(dualNBackDrill);
  registerDrill(samasyaPurtiDrill);

  // Phase 2 — Smriti
  registerDrill(verseRecallDrill);

  // Phase 2 — Sahitya
  registerDrill(nishedhakshariDrill);
  registerDrill(dattaPadiDrill);
  registerDrill(ashuKavitvaDrill);
  registerDrill(aprastutaPrasangaDrill);
  registerDrill(puranapathanaDrill);

  // Phase 2 — Dharana
  registerDrill(schulteDrill);
  registerDrill(stroopDrill);
  registerDrill(taskSwitchDrill);
  registerDrill(arithmeticLoadDrill);

  registered = true;
}

export {
  vyastaRecallDrill,
  digitSpanDrill,
  ghantaGananaDrill,
  dualNBackDrill,
  samasyaPurtiDrill,
  verseRecallDrill,
  nishedhakshariDrill,
  dattaPadiDrill,
  ashuKavitvaDrill,
  aprastutaPrasangaDrill,
  puranapathanaDrill,
  schulteDrill,
  stroopDrill,
  taskSwitchDrill,
  arithmeticLoadDrill,
};
