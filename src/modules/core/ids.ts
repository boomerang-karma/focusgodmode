/** Simple ID helpers — no crypto dependency required offline */

let counter = 0;

export function createId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createUserId(): string {
  return createId('user');
}

export function createSessionId(): string {
  return createId('sess');
}

export function createRoundId(): string {
  return createId('rnd');
}

export function createEventId(): string {
  return createId('evt');
}

export function createPromptId(): string {
  return createId('prm');
}
