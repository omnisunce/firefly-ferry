// Keyboard and mouse input for Firefly Ferry.
// One job: turn raw events into one clean steering state the world can read.

import { KEYS } from './config.js';

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const pointer = { x: 0, y: 0, down: false, active: false, seenAt: 0 };

  function isKey(list, code) {
    return list.includes(code);
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  window.addEventListener('blur', () => {
    held.clear();
    pointer.down = false;
  });

  function trackPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 1280;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 720;
    pointer.active = true;
    pointer.seenAt = performance.now();
  }
  canvas.addEventListener('pointermove', trackPointer);
  canvas.addEventListener('pointerdown', (event) => {
    trackPointer(event);
    pointer.down = true;
  });
  window.addEventListener('pointerup', () => {
    pointer.down = false;
  });

  return {
    // A unit-ish steering vector from the arrow / WASD keys, or null.
    keysVector() {
      let x = 0;
      let y = 0;
      if (KEYS.left.some((c) => held.has(c))) x -= 1;
      if (KEYS.right.some((c) => held.has(c))) x += 1;
      if (KEYS.up.some((c) => held.has(c))) y -= 1;
      if (KEYS.down.some((c) => held.has(c))) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    pointerSteer() {
      // Mouse steering only counts while the button is held, so a parked
      // cursor never drags the boat on its own.
      if (!pointer.down || !pointer.active) return null;
      return { x: pointer.x, y: pointer.y };
    },
    pointer,
    wasPressed(code) {
      return pressed.has(code);
    },
    anyOf(list) {
      return list.some((c) => pressed.has(c));
    },
    endFrame() {
      pressed.clear();
    },
  };
}
