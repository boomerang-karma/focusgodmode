/**
 * Drill registry — central plugin catalog.
 * Modules register drills at app boot; UI and session engine resolve by id.
 */

import type { Drill } from './drill';
import type { Pillar } from './types';

const drills = new Map<string, Drill>();

export function registerDrill(drill: Drill): void {
  if (drills.has(drill.meta.id)) {
    console.warn(`[registry] Overwriting drill: ${drill.meta.id}`);
  }
  drills.set(drill.meta.id, drill);
}

export function getDrill(id: string): Drill | undefined {
  return drills.get(id);
}

export function requireDrill(id: string): Drill {
  const d = drills.get(id);
  if (!d) throw new Error(`Unknown drill: ${id}`);
  return d;
}

export function listDrills(opts?: {
  enabledOnly?: boolean;
  pillar?: Pillar;
  parallelSafeOnly?: boolean;
}): Drill[] {
  let list = Array.from(drills.values());
  if (opts?.enabledOnly !== false) {
    list = list.filter((d) => d.meta.enabled);
  }
  if (opts?.pillar) {
    list = list.filter((d) => d.meta.pillar === opts.pillar);
  }
  if (opts?.parallelSafeOnly) {
    list = list.filter((d) => d.meta.parallelSafe);
  }
  return list.sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

export function listDrillIds(): string[] {
  return listDrills().map((d) => d.meta.id);
}

/** Called once at boot after all drill modules are imported */
export function getRegistrySize(): number {
  return drills.size;
}
