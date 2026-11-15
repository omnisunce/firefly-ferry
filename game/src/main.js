// Firefly Ferry — bootstrap and the game loop.
// One job: wire input, world, sound and rendering together, and run the
// start → playing → won/lost → restart loop at a steady frame rate.

import { KEYS, VIEW } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld } from './world.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = Math.round(VIEW.width * scale * window.devicePixelRatio);
  canvas.height = Math.round(VIEW.height * scale * window.devicePixelRatio);
  canvas.style.width = `${Math.round(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.round(VIEW.height * scale)}px`;
  ctx.setTransform(canvas.width / VIEW.width, 0, 0, canvas.height / VIEW.height, 0, 0);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 20261116);
const shot = params.get('shot');

const input = createInput(canvas);
const audio = createAudio();
const world = createWorld(seed);
const { state } = world;

if (shot) {
  applyShot(world, shot, seed);
} else {
  state.phase = 'start';
}

function announce() {
  if (!status) return;
  const phaseText = {
    start: 'Firefly Ferry. Press Enter to start.',
    playing: `Score ${state.score} of 300. ${Math.ceil(state.timeLeft)} seconds left. ${state.lives} hearts.`,
    paused: 'Paused.',
    won: `You won with ${state.score} points. Press R to play again.`,
    lost: `Game over with ${state.score} points. Press R to play again.`,
  };
  status.textContent = phaseText[state.phase] || '';
}

function playEventSounds(events) {
  events.forEach((event) => {
    if (event === 'collect') audio.collect(state.combo);
    if (event === 'deliver') audio.deliver();
    if (event === 'bump') audio.bump();
    if (event === 'dash') audio.dash();
    if (event === 'level') audio.levelUp();
    if (event === 'win') audio.win();
    if (event === 'lose') audio.lose();
  });
}

let last = performance.now();
let lastAnnounce = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;
  const events = [];

  audio.unlock();

  if (input.anyOf(KEYS.mute)) {
    const muted = audio.toggleMute();
    world.flash(muted ? 'Sound off (M to turn back on)' : 'Sound on');
  }

  if (state.phase === 'start') {
    if (input.anyOf(KEYS.start) || input.pointer.down) {
      world.start(seed + Math.floor(Math.random() * 1000));
      events.push('level');
      announce();
    }
  } else if (state.phase === 'playing') {
    if (input.anyOf(KEYS.pause)) {
      state.phase = 'paused';
    } else {
      const steer = {
        keys: input.keysVector(),
        pointer: input.pointerSteer(),
        dash: input.wasPressed('Space'),
      };
      world.update(dt, steer, events);
    }
  } else if (state.phase === 'paused') {
    if (input.anyOf(KEYS.pause)) state.phase = 'playing';
    if (input.anyOf(KEYS.restart)) world.start(seed + Math.floor(Math.random() * 1000));
  } else if (state.phase === 'won' || state.phase === 'lost') {
    if (input.anyOf(KEYS.restart) || input.anyOf(KEYS.start) || input.pointer.down) {
      world.start(seed + Math.floor(Math.random() * 1000));
      announce();
    }
  }

  playEventSounds(events);
  render(ctx, state, t);

  if (now - lastAnnounce > 1000) {
    lastAnnounce = now;
    announce();
  }
  input.endFrame();
  requestAnimationFrame(frame);
}

// Exposed for automated play-testing only; the game never reads it.
window.__ferry = { state, world };

announce();
requestAnimationFrame(frame);
