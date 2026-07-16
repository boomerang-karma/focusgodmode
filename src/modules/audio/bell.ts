/**
 * Bell scheduler — plays ghanta tones for ghanta-ganana and background avadhana.
 * Uses expo-av when available; falls back to haptics on failure.
 */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

let sound: Audio.Sound | null = null;
let prepared = false;

export async function prepareBell(): Promise<void> {
  if (prepared) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    // Procedural fallback: no bundled wav yet — use system click via haptics primarily.
    // Phase 2 can load require('../../assets/sounds/bell.mp3').
    prepared = true;
  } catch (e) {
    console.warn('[audio] prepareBell failed', e);
    prepared = true;
  }
}

export async function playBell(): Promise<void> {
  await prepareBell();
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Secondary soft haptic for "ring" feel
    setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 80);
  } catch {
    // Web / simulator without haptics
  }
}

export async function unloadBell(): Promise<void> {
  if (sound) {
    await sound.unloadAsync();
    sound = null;
  }
  prepared = false;
}

/**
 * Schedule bell callbacks relative to a start timestamp.
 * Returns a cancel function.
 */
export function scheduleBells(
  startAt: number,
  offsetsMs: number[],
  onBell: (atMs: number) => void,
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const now = Date.now();
  for (const atMs of offsetsMs) {
    const delay = Math.max(0, startAt + atMs - now);
    timers.push(
      setTimeout(() => {
        void playBell();
        onBell(atMs);
      }, delay),
    );
  }
  return () => timers.forEach(clearTimeout);
}
