/**
 * Append-only event log.
 * All metrics derive from events — survives schema evolution and syncs cleanly.
 */

import { createEventId } from './ids';
import type { EventType, PracticeEvent } from './types';

export type EventSink = (event: PracticeEvent) => void | Promise<void>;

export class EventLog {
  private events: PracticeEvent[] = [];
  private sinks: EventSink[] = [];

  constructor(
    private userId: string,
    private sessionId: string,
  ) {}

  onEvent(sink: EventSink): () => void {
    this.sinks.push(sink);
    return () => {
      this.sinks = this.sinks.filter((s) => s !== sink);
    };
  }

  async emit(
    type: EventType,
    payload: Record<string, unknown> = {},
    extra?: { roundId?: string; drillId?: string },
  ): Promise<PracticeEvent> {
    const event: PracticeEvent = {
      id: createEventId(),
      userId: this.userId,
      sessionId: this.sessionId,
      roundId: extra?.roundId,
      drillId: extra?.drillId,
      type,
      payload,
      createdAt: Date.now(),
    };
    this.events.push(event);
    for (const sink of this.sinks) {
      await sink(event);
    }
    return event;
  }

  getAll(): readonly PracticeEvent[] {
    return this.events;
  }

  filter(type: EventType): PracticeEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  forRound(roundId: string): PracticeEvent[] {
    return this.events.filter((e) => e.roundId === roundId);
  }

  clear(): void {
    this.events = [];
  }
}
