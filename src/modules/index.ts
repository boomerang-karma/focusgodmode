/**
 * Application module bootstrap.
 * Call `bootstrapModules()` once at app start.
 */

import { loadBuiltinContent } from './content';
import { registerAllDrills } from './drills';
import { getDb } from './db';
import { getRegistrySize } from './core';

let booted = false;

export async function bootstrapModules(): Promise<{ drills: number }> {
  if (booted) return { drills: getRegistrySize() };

  loadBuiltinContent();
  registerAllDrills();
  await getDb();

  booted = true;
  return { drills: getRegistrySize() };
}

// Re-export module roots for convenience
export * from './core';
export * from './content';
export * from './drills';
export * from './session';
export * from './tracking';
export * from './audio';
export * from './srs';
export * from './db';
export * from './notifications';
export * from './age';
