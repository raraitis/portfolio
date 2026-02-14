// Shared game loop with delta time, pause/resume.
// Designed for platformer game + any future animated sections.

export type TickFn = (dt: number, time: number) => void;

let running = false;
let paused = false;
let frameId = 0;
let lastTimestamp = 0;
let elapsed = 0;
const subscribers = new Set<TickFn>();

function tick(timestamp: number) {
  if (!running) return;
  if (lastTimestamp === 0) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  if (!paused) {
    elapsed += dt;
    for (const fn of subscribers) fn(dt, elapsed);
  }

  frameId = requestAnimationFrame(tick);
}

export function subscribe(fn: TickFn): () => void {
  subscribers.add(fn);
  if (!running) start();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) stop();
  };
}

export function start() {
  if (running) return;
  running = true;
  lastTimestamp = 0;
  frameId = requestAnimationFrame(tick);
}

export function stop() {
  running = false;
  cancelAnimationFrame(frameId);
}

export function pause() { paused = true; }
export function resume() { paused = false; }
export function isPaused() { return paused; }
