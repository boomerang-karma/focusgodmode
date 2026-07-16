/**
 * Session orchestrator — plays the prichchhakas.
 *
 * Solo: one drill, sequential prompts.
 * Avadhana: interleaves N parallel-safe drills, background bells, optional heckler,
 * deferred memory recall phase, then bell count report.
 */

import {
  createPromptId,
  createSessionId,
  EventLog,
  newSeed,
  requireDrill,
  stepDifficulty,
  type Difficulty,
  type PracticeEvent,
  type Prompt,
  type Response,
  type Round,
  type Score,
  type SessionConfig,
  type SessionStatus,
  type SessionSummary,
} from '../core';
import { generateBellSchedule } from '../drills/ghanta-ganana';
import { createRng, rngInt, rngPick } from '../core/rng';

export interface ActiveRound {
  round: Round;
  drillId: string;
  promptIndex: number;
  responses: Response[];
  score?: Score;
  startedAt: number;
  completed: boolean;
}

export interface BackgroundBell {
  atMs: number;
  fired: boolean;
}

export interface DeferredRecallItem {
  id: string;
  sourceDrillId: string;
  label: string;
  answer: string;
}

export interface HecklerPrompt {
  question: string;
  answer: string;
}

export interface SessionState {
  sessionId: string;
  userId: string;
  config: SessionConfig;
  status: SessionStatus;
  seed: string;
  startedAt: number;
  endedAt?: number;
  activeRounds: ActiveRound[];
  currentRoundIndex: number;
  bells: BackgroundBell[];
  bellCountHeard: number;
  eventLog: EventLog;
  journal?: string;
  difficulties: Record<string, Difficulty>;
  /** Collected during active phase for end-of-session recall */
  deferredItems: DeferredRecallItem[];
  deferredPromptIndex: number;
  deferredResponses: Response[];
  deferredPrompts: Prompt[];
  deferredScore?: Score;
  /** Pending heckler mid-stream */
  pendingHeckler: HecklerPrompt | null;
  hecklerResponses: { question: string; expected: string; got: string; correct: boolean }[];
  reportedBellCount?: number;
  lastSummary?: SessionSummary;
}

export type SessionListener = (state: SessionState, event?: PracticeEvent) => void;

const HECKLES: HecklerPrompt[] = [
  { question: 'Quick: 12 + 17?', answer: '29' },
  { question: 'Name a primary color.', answer: 'red' },
  { question: 'How many sides on a triangle?', answer: '3' },
  { question: 'What is 9 × 6?', answer: '54' },
  { question: 'Spell "bell" backwards.', answer: 'lleb' },
  { question: 'Capital of India?', answer: 'delhi' },
  { question: '2^5 = ?', answer: '32' },
];

export class SessionOrchestrator {
  private state: SessionState | null = null;
  private listeners: SessionListener[] = [];
  private promptsSinceHeckle = 0;

  subscribe(fn: SessionListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(event?: PracticeEvent): void {
    if (!this.state) return;
    for (const l of this.listeners) l(this.state, event);
  }

  getState(): SessionState | null {
    return this.state;
  }

  async start(
    userId: string,
    config: SessionConfig,
    difficulties: Record<string, Difficulty> = {},
  ): Promise<SessionState> {
    const sessionId = createSessionId();
    const seed = config.seed || newSeed();
    const eventLog = new EventLog(userId, sessionId);

    const diffs: Record<string, Difficulty> = {};
    for (const id of config.drillIds) {
      const drill = requireDrill(id);
      diffs[id] = difficulties[id] ?? drill.difficultyLadder[0];
    }

    const activeRounds: ActiveRound[] = config.drillIds.map((drillId, i) => {
      const drill = requireDrill(drillId);
      const round = drill.generateRound(diffs[drillId], `${seed}:${drillId}:${i}`);
      return {
        round,
        drillId,
        promptIndex: 0,
        responses: [],
        startedAt: Date.now(),
        completed: false,
      };
    });

    let bells: BackgroundBell[] = [];
    const ghantaRound = activeRounds.find((r) => r.drillId === 'ghanta_ganana');
    if (ghantaRound) {
      const schedule = (ghantaRound.round.expected.schedule as number[]) || [];
      bells = schedule.map((atMs) => ({ atMs, fired: false }));
    } else if (config.enableBell || config.mode === 'avadhana') {
      const durationMs =
        config.mode === 'avadhana'
          ? 90000 + config.drillIds.length * 30000
          : 60000;
      const schedule = generateBellSchedule(
        `${seed}:bells`,
        durationMs,
        Math.max(5, config.drillIds.length * 2),
        Math.max(10, config.drillIds.length * 4),
        3500,
      );
      bells = schedule.map((atMs) => ({ atMs, fired: false }));
    }

    // Harvest deferred memory items (encode payloads) for end recall in avadhana
    const deferredItems: DeferredRecallItem[] = [];
    if (config.mode === 'avadhana') {
      for (const ar of activeRounds) {
        for (const p of ar.round.prompts) {
          if (
            (p.kind === 'encode' || p.payload.phase === 'encode') &&
            p.payload.word
          ) {
            deferredItems.push({
              id: createPromptId(),
              sourceDrillId: ar.drillId,
              label: `From ${ar.drillId.replace(/_/g, ' ')} #${p.payload.position ?? '?'}`,
              answer: String(p.payload.word),
            });
          }
        }
      }
      // Cap deferred queries
      if (deferredItems.length > 8) {
        const rng = createRng(`${seed}:def`);
        const picked: DeferredRecallItem[] = [];
        const pool = [...deferredItems];
        while (picked.length < 6 && pool.length) {
          const i = rngInt(rng, 0, pool.length - 1);
          picked.push(pool.splice(i, 1)[0]);
        }
        deferredItems.length = 0;
        deferredItems.push(...picked);
      }
    }

    this.state = {
      sessionId,
      userId,
      config,
      status: 'active',
      seed,
      startedAt: Date.now(),
      activeRounds,
      currentRoundIndex: 0,
      bells,
      bellCountHeard: 0,
      eventLog,
      difficulties: diffs,
      deferredItems,
      deferredPromptIndex: 0,
      deferredResponses: [],
      deferredPrompts: deferredItems.map((item) => ({
        id: item.id,
        kind: 'deferred_recall',
        instruction: `Deferred recall: ${item.label}`,
        payload: { phase: 'deferred', sourceDrillId: item.sourceDrillId },
      })),
      pendingHeckler: null,
      hecklerResponses: [],
    };
    this.promptsSinceHeckle = 0;

    const ev = await eventLog.emit('session_start', {
      mode: config.mode,
      drillIds: config.drillIds,
      streamCount: config.streamCount,
      seed,
      deferredCount: deferredItems.length,
      bellCount: bells.length,
    });
    this.notify(ev);
    return this.state;
  }

  currentRound(): ActiveRound | null {
    if (!this.state || this.state.status !== 'active') return null;
    return this.state.activeRounds[this.state.currentRoundIndex] ?? null;
  }

  currentPrompt(): Prompt | null {
    if (!this.state) return null;

    if (this.state.status === 'active' && this.state.pendingHeckler) {
      return {
        id: 'heckler_live',
        kind: 'heckle_live',
        instruction: 'Interruption! Answer, then resume.',
        payload: {
          phase: 'heckle',
          question: this.state.pendingHeckler.question,
        },
        timeLimitMs: 20000,
      };
    }

    if (this.state.status === 'active') {
      const ar = this.currentRound();
      if (!ar || ar.completed) return null;
      return ar.round.prompts[ar.promptIndex] ?? null;
    }

    if (this.state.status === 'recall') {
      return this.state.deferredPrompts[this.state.deferredPromptIndex] ?? null;
    }

    if (this.state.status === 'bell_report') {
      return {
        id: 'bell_report_session',
        kind: 'bell_report',
        instruction: 'How many bells did you hear during the session?',
        payload: { phase: 'report' },
      };
    }

    return null;
  }

  async submitResponse(value: unknown, latencyMs?: number): Promise<void> {
    if (!this.state) return;

    // Heckler branch
    if (this.state.status === 'active' && this.state.pendingHeckler) {
      const expected = this.state.pendingHeckler.answer.toLowerCase().trim();
      const got = String(value ?? '')
        .toLowerCase()
        .trim();
      const correct =
        got === expected || got.includes(expected) || expected.includes(got);
      this.state.hecklerResponses.push({
        question: this.state.pendingHeckler.question,
        expected,
        got,
        correct,
      });
      await this.state.eventLog.emit('heckler', {
        question: this.state.pendingHeckler.question,
        got,
        correct,
      });
      this.state.pendingHeckler = null;
      this.promptsSinceHeckle = 0;
      this.notify();
      return;
    }

    if (this.state.status === 'recall') {
      await this.submitDeferred(value, latencyMs);
      return;
    }

    if (this.state.status === 'bell_report') {
      const n = parseInt(String(value ?? ''), 10);
      this.state.reportedBellCount = Number.isNaN(n) ? -1 : n;
      await this.finish();
      return;
    }

    if (this.state.status !== 'active') return;
    const ar = this.currentRound();
    if (!ar) return;
    const prompt = ar.round.prompts[ar.promptIndex];
    if (!prompt) return;

    const response: Response = {
      promptId: prompt.id,
      value,
      respondedAt: Date.now(),
      latencyMs,
    };
    ar.responses.push(response);

    const ev = await this.state.eventLog.emit(
      'prompt_response',
      { promptId: prompt.id, value, latencyMs },
      { roundId: ar.round.id, drillId: ar.drillId },
    );

    ar.promptIndex += 1;
    this.promptsSinceHeckle += 1;

    // Maybe inject heckler
    if (
      this.state.config.enableHeckler &&
      this.state.config.mode === 'avadhana' &&
      this.promptsSinceHeckle >= 4 &&
      !this.state.pendingHeckler
    ) {
      const rng = createRng(`${this.state.seed}:heck:${this.promptsSinceHeckle}`);
      if (rng() < 0.35) {
        this.state.pendingHeckler = rngPick(rng, HECKLES);
      }
    }

    if (ar.promptIndex >= ar.round.prompts.length) {
      await this.completeRound(ar);
    }

    this.notify(ev);
  }

  async advanceTimedPrompt(autoValue: unknown = null): Promise<void> {
    await this.submitResponse(autoValue, 0);
  }

  private async submitDeferred(value: unknown, latencyMs?: number): Promise<void> {
    if (!this.state || this.state.status !== 'recall') return;
    const prompt = this.state.deferredPrompts[this.state.deferredPromptIndex];
    if (!prompt) return;

    this.state.deferredResponses.push({
      promptId: prompt.id,
      value,
      respondedAt: Date.now(),
      latencyMs,
    });
    this.state.deferredPromptIndex += 1;

    if (this.state.deferredPromptIndex >= this.state.deferredPrompts.length) {
      // Score deferred
      let correct = 0;
      for (let i = 0; i < this.state.deferredItems.length; i++) {
        const got = String(this.state.deferredResponses[i]?.value ?? '')
          .toLowerCase()
          .trim();
        const exp = this.state.deferredItems[i].answer.toLowerCase().trim();
        if (got === exp) correct += 1;
      }
      const total = this.state.deferredItems.length;
      this.state.deferredScore = {
        correct,
        total,
        accuracy: total ? correct / total : 1,
        details: { deferred: true },
        difficultyDelta: 0,
      };
      await this.state.eventLog.emit('recall_phase_end', {
        score: this.state.deferredScore,
      });

      if (this.state.bells.length > 0 && this.state.config.enableBell) {
        this.state.status = 'bell_report';
        this.notify();
      } else {
        await this.finish();
      }
    } else {
      this.notify();
    }
  }

  private async completeRound(ar: ActiveRound): Promise<void> {
    if (!this.state) return;
    const drill = requireDrill(ar.drillId);
    ar.score = drill.score(ar.round, ar.responses);
    ar.completed = true;

    const next = stepDifficulty(
      drill,
      this.state.difficulties[ar.drillId],
      ar.score.difficultyDelta,
    );
    this.state.difficulties[ar.drillId] = next;

    await this.state.eventLog.emit(
      'round_end',
      {
        score: ar.score,
        difficulty: ar.round.difficulty,
        nextDifficulty: next,
      },
      { roundId: ar.round.id, drillId: ar.drillId },
    );

    if (this.state.config.mode === 'solo') {
      await this.enterRecallOrFinish();
      return;
    }

    const nextIdx = this.findNextIncomplete(this.state.currentRoundIndex);
    if (nextIdx === -1) {
      await this.enterRecallOrFinish();
    } else {
      this.state.currentRoundIndex = nextIdx;
    }
  }

  private findNextIncomplete(from: number): number {
    if (!this.state) return -1;
    const n = this.state.activeRounds.length;
    for (let i = 1; i <= n; i++) {
      const idx = (from + i) % n;
      if (!this.state.activeRounds[idx].completed) return idx;
    }
    return -1;
  }

  private async enterRecallOrFinish(): Promise<void> {
    if (!this.state) return;

    if (
      this.state.config.mode === 'avadhana' &&
      this.state.deferredPrompts.length > 0
    ) {
      this.state.status = 'recall';
      await this.state.eventLog.emit('recall_phase_start', {
        count: this.state.deferredPrompts.length,
      });
      this.notify();
      return;
    }

    if (
      this.state.config.mode === 'avadhana' &&
      this.state.bells.length > 0 &&
      this.state.config.enableBell
    ) {
      this.state.status = 'bell_report';
      this.notify();
      return;
    }

    await this.finish();
  }

  async finish(journal?: string): Promise<SessionSummary | null> {
    if (!this.state) return null;
    if (journal) this.state.journal = journal;

    this.state.status = 'completed';
    this.state.endedAt = Date.now();

    const scores: Record<string, Score> = {};
    let accSum = 0;
    let accN = 0;
    for (const ar of this.state.activeRounds) {
      if (ar.score) {
        scores[ar.drillId] = ar.score;
        accSum += ar.score.accuracy;
        accN += 1;
      }
    }
    if (this.state.deferredScore) {
      scores['__deferred_recall'] = this.state.deferredScore;
      accSum += this.state.deferredScore.accuracy;
      accN += 1;
    }

    const overallAccuracy = accN ? accSum / accN : 0;

    let parallel = 0;
    for (const ar of this.state.activeRounds) {
      if (ar.score && ar.score.accuracy >= 0.9) parallel += 1;
    }
    if (this.state.config.mode === 'solo' && overallAccuracy >= 0.9) {
      parallel = Math.max(parallel, 1);
    }
    // Avadhana bonus: deferred + bells count toward stream skill
    if (
      this.state.config.mode === 'avadhana' &&
      this.state.deferredScore &&
      this.state.deferredScore.accuracy >= 0.9
    ) {
      parallel = Math.max(parallel, Math.min(this.state.config.streamCount, parallel + 1));
    }

    let bellAccuracy: number | undefined;
    if (this.state.bells.length > 0 && this.state.reportedBellCount != null) {
      const trueCount = this.state.bells.filter((b) => b.fired).length || this.state.bells.length;
      const err = Math.abs(this.state.reportedBellCount - trueCount);
      bellAccuracy = err === 0 ? 1 : err === 1 ? 0.5 : 0;
    }

    const summary: SessionSummary = {
      sessionId: this.state.sessionId,
      mode: this.state.config.mode,
      drillIds: this.state.config.drillIds,
      startedAt: this.state.startedAt,
      endedAt: this.state.endedAt,
      durationMs: this.state.endedAt - this.state.startedAt,
      overallAccuracy,
      parallelismIndex: parallel,
      scores,
      eventCount: this.state.eventLog.getAll().length,
      bellAccuracy,
      trueBellCount: this.state.bells.length,
      reportedBellCount: this.state.reportedBellCount,
      deferredRecallAccuracy: this.state.deferredScore?.accuracy,
    };

    this.state.lastSummary = summary;

    await this.state.eventLog.emit('session_end', {
      summary,
      journal: this.state.journal,
      trueBellCount: this.state.bells.length,
      heckler: this.state.hecklerResponses,
    });
    if (this.state.journal) {
      await this.state.eventLog.emit('journal_entry', { text: this.state.journal });
    }

    this.notify();
    return summary;
  }

  async abandon(): Promise<void> {
    if (!this.state) return;
    this.state.status = 'abandoned';
    this.state.endedAt = Date.now();
    await this.state.eventLog.emit('session_end', { abandoned: true });
    this.notify();
  }

  fireBell(atMs: number): void {
    if (!this.state) return;
    if (this.state.status !== 'active' && this.state.status !== 'recall') return;
    const bell = this.state.bells.find((b) => b.atMs === atMs && !b.fired);
    if (!bell) return;
    bell.fired = true;
    this.state.bellCountHeard += 1;
    void this.state.eventLog.emit('background_event', {
      kind: 'bell',
      atMs,
      countSoFar: this.state.bellCountHeard,
    });
    this.notify();
  }

  focusStream(index: number): void {
    if (!this.state || this.state.config.mode !== 'avadhana') return;
    if (this.state.status !== 'active') return;
    if (index < 0 || index >= this.state.activeRounds.length) return;
    if (this.state.activeRounds[index].completed) return;
    this.state.currentRoundIndex = index;
    this.notify();
  }
}

/** Singleton for app-wide session access */
export const sessionOrchestrator = new SessionOrchestrator();
