// The river world of Firefly Ferry: boat, fireflies, docks, rocks and logs.
// One job: own every entity, spawn it, move it and settle every collision.
// Rendering lives in render.js; this file only decides what is true.

import { GAME, VIEW } from './config.js';
import { clamp, distance, mulberry32, range } from './random.js';

export function createWorld(seed) {
  const rng = mulberry32(seed);
  const state = {
    phase: 'start', // start | playing | paused | won | lost
    score: 0,
    carried: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    lives: GAME.startLives,
    level: 1,
    timeLeft: GAME.startTime,
    dashTimer: 0,
    dashCooldown: 0,
    invulnerable: 0,
    elapsed: 0,
    delivered: 0,
    collected: 0,
    message: '',
    messageTimer: 0,
    boat: {
      x: VIEW.width / 2,
      y: VIEW.height - 140,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      trail: [],
    },
    fireflies: [],
    rocks: [],
    logs: [],
    lilies: [],
    particles: [],
    stars: [],
    docks: [
      { x: 90, y: 190, side: 'left', pulse: 0 },
      { x: VIEW.width - 90, y: 500, side: 'right', pulse: 0 },
    ],
  };

  for (let i = 0; i < 90; i++) {
    state.stars.push({ x: rng() * VIEW.width, y: rng() * 190, r: range(rng, 0.6, 1.8), tw: range(rng, 0, 6.28) });
  }
  for (let i = 0; i < 10; i++) {
    state.lilies.push({
      x: range(rng, 60, VIEW.width - 60),
      y: range(rng, 90, VIEW.height - 60),
      r: range(rng, 14, 26),
      flower: rng() < 0.3,
      phase: range(rng, 0, 6.28),
    });
  }

  function spawnFirefly() {
    state.fireflies.push({
      x: range(rng, 120, VIEW.width - 120),
      y: range(rng, 110, VIEW.height - 110),
      r: 9,
      phase: range(rng, 0, 6.28),
      drift: range(rng, 6, 18),
      born: state.elapsed,
    });
  }

  function spawnRock() {
    const top = rng() < 0.5;
    state.rocks.push({
      x: range(rng, 130, VIEW.width - 130),
      y: top ? range(rng, 110, 240) : range(rng, VIEW.height - 260, VIEW.height - 110),
      r: range(rng, 18, 30),
      wobble: range(rng, 0, 6.28),
    });
  }

  function spawnLog() {
    state.logs.push({
      x: rng() < 0.5 ? -70 : VIEW.width + 70,
      y: range(rng, 130, VIEW.height - 130),
      len: range(rng, 70, 120),
      speed: range(rng, 26, 48) * (1 + (state.level - 1) * 0.12),
      dir: 0,
      angle: range(rng, -0.12, 0.12),
      spin: range(rng, -0.05, 0.05),
    });
    const log = state.logs[state.logs.length - 1];
    log.dir = log.x < 0 ? 1 : -1;
  }

  function burst(x, y, colour, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const s = range(rng, 20, speed);
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: range(rng, 0.4, 0.9), max: 0.9, colour, r: range(rng, 2, 4.5) });
    }
  }

  function flash(text) {
    state.message = text;
    state.messageTimer = 2.2;
  }

  function reset(seedValue) {
    // createWorld returns { state, start, reset, ... }: only its fresh
    // *state* object holds the new values — copying the wrapper would
    // paste functions onto the state and leave the old score standing.
    const freshState = createWorld(seedValue).state;
    Object.keys(freshState).forEach((k) => {
      state[k] = freshState[k];
    });
    state.phase = 'playing';
  }

  function start(seedValue) {
    reset(seedValue);
    for (let i = 0; i < 6; i++) spawnFirefly();
    for (let i = 0; i < 5; i++) spawnRock();
    for (let i = 0; i < 2; i++) spawnLog();
    flash('Collect fireflies — deliver 5 at a glowing dock!');
  }

  function levelCheck(events) {
    const next = Math.floor(state.score / 100) + 1;
    if (next > state.level) {
      state.level = next;
      events.push('level');
      flash(`Level ${next} — the river quickens!`);
      spawnLog();
    }
  }

  function hitHazard(events, kind, x, y) {
    if (state.invulnerable > 0 || state.phase !== 'playing') return;
    state.lives -= 1;
    state.combo = 0;
    state.carried = Math.max(0, state.carried - 2);
    state.invulnerable = GAME.invulnerableTime;
    state.boat.vx = (state.boat.x - x) * 2.2;
    state.boat.vy = (state.boat.y - y) * 2.2;
    burst(state.boat.x, state.boat.y, '#ff6b6b', 16, 160);
    events.push('bump');
    flash(kind === 'log' ? 'A drifting log! −1 heart' : 'Rock! −1 heart');
    if (state.lives <= 0) {
      state.phase = 'lost';
      events.push('lose');
    }
  }

  function update(dt, steer, events) {
    if (state.phase !== 'playing') return;
    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (state.invulnerable > 0) state.invulnerable -= dt;
    if (state.dashCooldown > 0) state.dashCooldown -= dt;
    if (state.dashTimer > 0) state.dashTimer -= dt;

    // Boat: keyboard vector, or easing toward the held mouse point.
    const boat = state.boat;
    const accel = 900;
    const maxSpeed = 250 + (state.level - 1) * 14 + (state.dashTimer > 0 ? GAME.dashSpeed : 0);
    if (steer.keys) {
      boat.vx += steer.keys.x * accel * dt;
      boat.vy += steer.keys.y * accel * dt;
    } else if (steer.pointer) {
      const dx = steer.pointer.x - boat.x;
      const dy = steer.pointer.y - boat.y;
      const d = Math.hypot(dx, dy);
      if (d > 12) {
        boat.vx += (dx / d) * accel * 0.8 * dt;
        boat.vy += (dy / d) * accel * 0.8 * dt;
      }
    }
    boat.vx *= Math.pow(0.12, dt);
    boat.vy *= Math.pow(0.12, dt);
    const speed = Math.hypot(boat.vx, boat.vy);
    if (speed > maxSpeed) {
      boat.vx = (boat.vx / speed) * maxSpeed;
      boat.vy = (boat.vy / speed) * maxSpeed;
    }
    boat.x = clamp(boat.x + boat.vx * dt, 70, VIEW.width - 70);
    boat.y = clamp(boat.y + boat.vy * dt, 90, VIEW.height - 50);
    if (speed > 40) boat.angle = Math.atan2(boat.vy, boat.vx);
    boat.trail.push({ x: boat.x, y: boat.y, life: 0.5 });
    if (boat.trail.length > 26) boat.trail.shift();
    boat.trail.forEach((t) => {
      t.life -= dt;
    });
    state.boat.trail = boat.trail.filter((t) => t.life > 0);

    if (steer.dash && state.dashCooldown <= 0) {
      state.dashTimer = 0.22;
      state.dashCooldown = GAME.dashCooldown;
      events.push('dash');
      burst(boat.x, boat.y, '#7ef0d4', 10, 120);
    }

    // Fireflies drift and twinkle; collecting one feeds the combo.
    state.fireflies.forEach((f) => {
      f.phase += dt * 2;
      f.y += Math.sin(f.phase) * f.drift * dt * 0.4;
      f.x += Math.cos(f.phase * 0.7) * 6 * dt;
    });
    for (let i = state.fireflies.length - 1; i >= 0; i--) {
      const f = state.fireflies[i];
      if (distance(boat.x, boat.y, f.x, f.y) < GAME.boatRadius + f.r + 6) {
        state.fireflies.splice(i, 1);
        state.collected += 1;
        state.carried += 1;
        state.combo = Math.min(state.combo + 1, GAME.maxCombo);
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        state.comboTimer = GAME.comboWindow;
        const gained = GAME.fireflyScore * state.combo;
        state.score += gained;
        burst(f.x, f.y, '#d8ff7a', 12, 130);
        events.push('collect');
        spawnFirefly();
        levelCheck(events);
        if (state.score >= GAME.targetScore) {
          state.phase = 'won';
          events.push('win');
          return;
        }
      }
    }

    // Docks: carrying five or more, sail in to cash them in for bonus + time.
    state.docks.forEach((dock) => {
      dock.pulse += dt * 3;
      if (state.carried >= GAME.deliverNeed && distance(boat.x, boat.y, dock.x, dock.y) < 58) {
        const bonus = state.carried * GAME.deliverBonus;
        state.score += bonus;
        state.timeLeft += GAME.deliverTimeBonus;
        state.delivered += state.carried;
        burst(dock.x, dock.y, '#7ef0d4', 22, 180);
        events.push('deliver');
        flash(`Delivered ${state.carried} fireflies! +${bonus} pts, +${GAME.deliverTimeBonus}s`);
        state.carried = 0;
        state.combo = Math.min(state.combo + 1, GAME.maxCombo);
        levelCheck(events);
        if (state.score >= GAME.targetScore) {
          state.phase = 'won';
          events.push('win');
        }
      }
    });

    // Hazards: still rocks hurt, drifting logs hurt and keep moving.
    state.rocks.forEach((r) => {
      r.wobble += dt;
      if (distance(boat.x, boat.y, r.x, r.y) < GAME.boatRadius + r.r - 6) hitHazard(events, 'rock', r.x, r.y);
    });
    state.logs.forEach((log) => {
      log.x += log.dir * log.speed * dt;
      log.angle += log.spin * dt;
      if (log.x < -140) {
        log.x = VIEW.width + 120;
        log.y = range(rng, 130, VIEW.height - 130);
      }
      if (log.x > VIEW.width + 140) {
        log.x = -120;
        log.y = range(rng, 130, VIEW.height - 130);
      }
      const dx = boat.x - log.x;
      const dy = boat.y - log.y;
      const along = Math.abs(dx * Math.cos(log.angle) + dy * Math.sin(log.angle));
      const across = Math.abs(-dx * Math.sin(log.angle) + dy * Math.cos(log.angle));
      if (along < log.len / 2 + 14 && across < 20) hitHazard(events, 'log', log.x, log.y);
    });

    // Keep the river populated; the current quickens with the level.
    if (state.fireflies.length < 5 + Math.min(state.level, 3)) spawnFirefly();
    if (state.rocks.length < 4 + state.level && rng() < dt * 0.25) spawnRock();
    if (state.logs.length < 1 + Math.floor(state.level / 2) && rng() < dt * 0.2) spawnLog();

    state.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    });
    state.particles = state.particles.filter((p) => p.life > 0);

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      if (state.score >= GAME.targetScore) {
        state.phase = 'won';
        events.push('win');
      } else {
        state.phase = 'lost';
        events.push('lose');
      }
    }
  }

  return { state, start, reset, update, spawnFirefly, spawnRock, spawnLog, burst, flash };
}
