// Type-safe event bus (pub/sub) for cross-component section/navigation events.

export type SectionName = 'home' | 'me' | 'portfolio' | 'game';

type EventMap = {
  'navigate': SectionName;
  'section-changed': SectionName;
  'warp-trigger': void;
  'background-section': SectionName;
  // Game events
  'game-start': void;
  'game-pause': void;
  'game-resume': void;
  'game-score': number;
};

type Callback<K extends keyof EventMap> =
  EventMap[K] extends void ? () => void : (data: EventMap[K]) => void;

const listeners = new Map<string, Set<Function>>();

export function emit<K extends keyof EventMap>(
  event: K,
  ...args: EventMap[K] extends void ? [] : [EventMap[K]]
): void {
  const set = listeners.get(event);
  if (set) for (const fn of set) fn(...args);
}

export function on<K extends keyof EventMap>(
  event: K,
  callback: Callback<K>,
): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(callback);
  return () => { listeners.get(event)?.delete(callback); };
}
