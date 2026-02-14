// Keyboard + touch input manager for platformer game.
// Supports WASD, arrow keys, space, and virtual touch buttons.

export type InputAction = 'left' | 'right' | 'up' | 'down' | 'jump';

const pressed = new Set<InputAction>();
const justPressed = new Set<InputAction>();

const keyMap: Record<string, InputAction> = {
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  Space: 'jump',
};

function onKeyDown(e: KeyboardEvent) {
  const action = keyMap[e.code];
  if (action) {
    if (!pressed.has(action)) justPressed.add(action);
    pressed.add(action);
    e.preventDefault();
  }
}

function onKeyUp(e: KeyboardEvent) {
  const action = keyMap[e.code];
  if (action) {
    pressed.delete(action);
    e.preventDefault();
  }
}

let bound = false;

export function bind() {
  if (bound) return;
  bound = true;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

export function unbind() {
  bound = false;
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  pressed.clear();
  justPressed.clear();
}

/** True while the key is held down */
export function isPressed(action: InputAction): boolean {
  return pressed.has(action);
}

/** True only on the first frame the key is pressed — call consumeJustPressed() at end of tick */
export function wasJustPressed(action: InputAction): boolean {
  return justPressed.has(action);
}

/** Call at the end of each game tick to reset just-pressed state */
export function consumeJustPressed() {
  justPressed.clear();
}

/** Simulate a touch press (for virtual buttons on mobile) */
export function touchPress(action: InputAction) {
  if (!pressed.has(action)) justPressed.add(action);
  pressed.add(action);
}

export function touchRelease(action: InputAction) {
  pressed.delete(action);
}
