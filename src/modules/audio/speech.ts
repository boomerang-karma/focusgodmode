/**
 * TTS prompts — optional spoken encoding for oral tradition practice.
 */

import * as Speech from 'expo-speech';

export function speak(text: string, opts?: { rate?: number; language?: string }): void {
  try {
    Speech.stop();
    Speech.speak(text, {
      rate: opts?.rate ?? 0.9,
      language: opts?.language ?? 'en-US',
    });
  } catch (e) {
    console.warn('[speech] speak failed', e);
  }
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
