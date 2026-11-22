// Keyboard and mouse input for THE GILDED FOX.
// One shared input object: the game loop reads it, the menus read the
// clicks. Keys are tracked by code, so WASD and arrows both work, and the
// coin is aimed with the mouse position on the canvas.

export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    sprint: false,
    pick: false,
    tool: null,
    aimX: 0,
    aimY: 0,
    // Clicks, consumed by whoever reads them first.
    clicks: [],
    mouseX: 0,
    mouseY: 0,
    keysDown: {},
  };

  const KEYMAP = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
    Space: 'sprint',
    KeyE: 'pick',
  };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.preventDefault();
    const field = KEYMAP[e.code];
    if (field) input[field] = true;
    input.keysDown[e.code] = true;
    if (e.code === 'Digit1') input.tool = 'coin';
    if (e.code === 'Digit2') input.tool = 'smoke';
    if (e.code === 'Digit3') input.tool = 'emp';
  });

  window.addEventListener('keyup', (e) => {
    const field = KEYMAP[e.code];
    if (field) input[field] = false;
    input.keysDown[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    input.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    input.aimX = input.mouseX;
    input.aimY = input.mouseY;
  });

  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    input.clicks.push({ x, y });
    input.mouseX = x;
    input.mouseY = y;
    input.aimX = x;
    input.aimY = y;
  });

  return input;
}

// Was this key pressed since the last frame? (edge-triggered, not held)
export function pressed(input, code) {
  if (input.keysDown[code]) {
    input.keysDown[code] = false;
    return true;
  }
  return false;
}

// Take the oldest unconsumed click, or null.
export function takeClick(input) {
  return input.clicks.shift() || null;
}

export function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w &&
    point.y >= rect.y && point.y <= rect.y + rect.h;
}
