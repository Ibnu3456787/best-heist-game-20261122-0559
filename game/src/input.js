// THE GILDED FOX — keyboard and mouse. WASD and arrows move; Shift sneaks,
// Space sprints, E picks locks, 1/2/3 spend tools, M mutes, P pauses, Esc
// backs out. The mouse aims the coin (click where it should land) and
// presses every on-screen button. Input is polled each frame, never event
// queued, so a held key and a staged replay behave the same way.
import { VIEW } from './config.js';

/** Fresh input state, bound to a canvas element. */
export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false, // consumed by the main loop each frame
    clickX: 0,
    clickY: 0,
  };

  const toGame = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  };

  globalThis.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    input.keys.add(event.key.toLowerCase());
  });
  globalThis.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });
  globalThis.addEventListener('blur', () => input.keys.clear());
  canvas.addEventListener('mousemove', (event) => {
    const pos = toGame(event);
    input.mouseX = pos.x;
    input.mouseY = pos.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const pos = toGame(event);
    input.mouseDown = true;
    input.clicked = true;
    input.clickX = pos.x;
    input.clickY = pos.y;
  });
  globalThis.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  return input;
}

/** True when a key is held right now (case-insensitive). */
export function keyDown(input, key) {
  return input.keys.has(key.toLowerCase());
}

/** The movement vector from the held keys, each component in [-1, 1]. */
export function moveVector(input) {
  let dx = 0;
  let dy = 0;
  if (keyDown(input, 'a') || keyDown(input, 'arrowleft')) dx -= 1;
  if (keyDown(input, 'd') || keyDown(input, 'arrowright')) dx += 1;
  if (keyDown(input, 'w') || keyDown(input, 'arrowup')) dy -= 1;
  if (keyDown(input, 's') || keyDown(input, 'arrowdown')) dy += 1;
  return { dx, dy };
}

/** True when the point (x, y) lies inside rect { x, y, w, h }. */
export function inRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
