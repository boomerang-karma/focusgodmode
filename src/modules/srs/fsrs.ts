/**
 * Lightweight FSRS-inspired spaced repetition for verse/shloka/quiz cards.
 * Phase 2 full integration; phase 1 ships algorithm + storage hooks.
 *
 * Simplified scheduling: Good → interval grows; Again → reset.
 * Replace with full FSRS params later without changing card schema.
 */

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCard {
  id: string;
  userId: string;
  contentPackId: string;
  front: string;
  back: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  dueAt: number;
  lastReviewAt: number | null;
  state: 'new' | 'learning' | 'review' | 'relearning';
}

const DAY = 24 * 60 * 60 * 1000;

export function createCard(
  id: string,
  userId: string,
  contentPackId: string,
  front: string,
  back: string,
): SrsCard {
  return {
    id,
    userId,
    contentPackId,
    front,
    back,
    stability: 0,
    difficulty: 5,
    reps: 0,
    lapses: 0,
    dueAt: Date.now(),
    lastReviewAt: null,
    state: 'new',
  };
}

export function reviewCard(card: SrsCard, rating: SrsRating, now = Date.now()): SrsCard {
  const next = { ...card, lastReviewAt: now, reps: card.reps + 1 };

  switch (rating) {
    case 'again':
      next.lapses += 1;
      next.stability = Math.max(0.5, card.stability * 0.5);
      next.difficulty = Math.min(10, card.difficulty + 1);
      next.dueAt = now + 10 * 60 * 1000; // 10 min
      next.state = card.state === 'new' ? 'learning' : 'relearning';
      break;
    case 'hard':
      next.stability = Math.max(1, card.stability * 1.2);
      next.difficulty = Math.min(10, card.difficulty + 0.3);
      next.dueAt = now + next.stability * DAY * 0.8;
      next.state = 'review';
      break;
    case 'good':
      next.stability = card.stability < 1 ? 1 : card.stability * 2.5;
      next.difficulty = Math.max(1, card.difficulty - 0.1);
      next.dueAt = now + next.stability * DAY;
      next.state = 'review';
      break;
    case 'easy':
      next.stability = card.stability < 1 ? 3 : card.stability * 3.5;
      next.difficulty = Math.max(1, card.difficulty - 0.4);
      next.dueAt = now + next.stability * DAY;
      next.state = 'review';
      break;
  }

  return next;
}

export function dueCards(cards: SrsCard[], now = Date.now()): SrsCard[] {
  return cards.filter((c) => c.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
}
