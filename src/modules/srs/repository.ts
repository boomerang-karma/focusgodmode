/**
 * SRS persistence + verse pack seeding.
 */

import { createId } from '../core';
import { getVersePack } from '../content';
import { getAll, getFirst, run } from '../db/client';
import {
  createCard,
  dueCards,
  reviewCard,
  type SrsCard,
  type SrsRating,
} from './fsrs';

function rowToCard(r: {
  id: string;
  user_id: string;
  content_pack_id: string;
  front: string;
  back: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  due_at: number;
  last_review_at: number | null;
  state: string;
}): SrsCard {
  return {
    id: r.id,
    userId: r.user_id,
    contentPackId: r.content_pack_id,
    front: r.front,
    back: r.back,
    stability: r.stability,
    difficulty: r.difficulty,
    reps: r.reps,
    lapses: r.lapses,
    dueAt: r.due_at,
    lastReviewAt: r.last_review_at,
    state: r.state as SrsCard['state'],
  };
}

export async function ensureVerseCards(userId: string): Promise<number> {
  const existing = await getFirst<{ c: number }>(
    `SELECT COUNT(*) as c FROM srs_cards WHERE user_id = ? AND content_pack_id = ?`,
    [userId, 'verses-classic'],
  );
  if ((existing?.c ?? 0) > 0) return existing!.c;

  const pack = getVersePack();
  let n = 0;
  for (const verse of pack.items) {
    // Front: title + first line cue; back: full verse + translation
    const card = createCard(
      createId('srs'),
      userId,
      pack.id,
      `${verse.title}\n\n(recall all lines)`,
      `${verse.lines.join('\n')}\n\n— ${verse.translation}`,
    );
    await saveCard(card);
    n += 1;

    // Line-level cards
    for (let i = 0; i < verse.lines.length; i++) {
      const lineCard = createCard(
        createId('srs'),
        userId,
        pack.id,
        `${verse.title} · line ${i + 1}/${verse.lines.length}\n\n${verse.lines[i].slice(0, 12)}…`,
        verse.lines[i],
      );
      await saveCard(lineCard);
      n += 1;
    }
  }
  return n;
}

export async function saveCard(card: SrsCard): Promise<void> {
  await run(
    `INSERT OR REPLACE INTO srs_cards
     (id, user_id, content_pack_id, front, back, stability, difficulty, reps, lapses, due_at, last_review_at, state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      card.id,
      card.userId,
      card.contentPackId,
      card.front,
      card.back,
      card.stability,
      card.difficulty,
      card.reps,
      card.lapses,
      card.dueAt,
      card.lastReviewAt,
      card.state,
    ],
  );
}

export async function listCards(userId: string): Promise<SrsCard[]> {
  const rows = await getAll<{
    id: string;
    user_id: string;
    content_pack_id: string;
    front: string;
    back: string;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    due_at: number;
    last_review_at: number | null;
    state: string;
  }>(`SELECT * FROM srs_cards WHERE user_id = ? ORDER BY due_at ASC`, [userId]);
  return rows.map(rowToCard);
}

export async function getDueCards(userId: string, limit = 20): Promise<SrsCard[]> {
  await ensureVerseCards(userId);
  const all = await listCards(userId);
  return dueCards(all).slice(0, limit);
}

export async function rateCard(card: SrsCard, rating: SrsRating): Promise<SrsCard> {
  const next = reviewCard(card, rating);
  await saveCard(next);
  return next;
}

export async function srsStats(userId: string): Promise<{
  total: number;
  due: number;
  newCount: number;
  reviewCount: number;
}> {
  await ensureVerseCards(userId);
  const all = await listCards(userId);
  const due = dueCards(all);
  return {
    total: all.length,
    due: due.length,
    newCount: all.filter((c) => c.state === 'new').length,
    reviewCount: all.filter((c) => c.state === 'review').length,
  };
}
