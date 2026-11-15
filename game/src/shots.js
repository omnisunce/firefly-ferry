// Screenshot presets for Firefly Ferry.
// One job: given ?shot=start|play|win|lose (and ?seed=), put the world into
// a fixed, readable state so the four screenshots show the whole loop.
// These states are only for screenshots; normal play never reads them.

import { GAME } from './config.js';

export function applyShot(world, shot, seed) {
  const { state } = world;
  if (shot === 'start') {
    // Populate the river first so the title sits over a living scene,
    // then hold on the title screen (the boat stays hidden until play).
    world.start(seed);
    state.phase = 'start';
    return;
  }
  if (shot === 'play') {
    world.start(seed);
    // A busy mid-game moment: part-way to the target, one heart down,
    // a combo running, a full load ready to deliver at the near dock.
    state.score = 120;
    state.level = 2;
    state.timeLeft = 47;
    state.lives = 2;
    state.carried = 5;
    state.combo = 3;
    state.comboTimer = 2.5;
    state.bestCombo = 3;
    state.collected = 14;
    state.boat.x = 560;
    state.boat.y = 380;
    state.boat.vx = 90;
    state.boat.vy = -40;
    state.boat.angle = -0.5;
    state.message = 'Full load — sail to the glowing dock!';
    state.messageTimer = 10;
    state.fireflies = state.fireflies.slice(0, 5);
    state.fireflies[0].x = 700;
    state.fireflies[0].y = 300;
    state.fireflies[1].x = 820;
    state.fireflies[1].y = 430;
    state.fireflies[2].x = 430;
    state.fireflies[2].y = 260;
    state.fireflies[3].x = 980;
    state.fireflies[3].y = 560;
    state.fireflies[4].x = 300;
    state.fireflies[4].y = 500;
    return;
  }
  if (shot === 'win') {
    world.start(seed);
    state.phase = 'won';
    state.score = 320;
    state.level = 4;
    state.timeLeft = 12;
    state.lives = 2;
    state.carried = 0;
    state.combo = 0;
    state.bestCombo = 5;
    state.collected = 22;
    state.delivered = 15;
    state.boat.x = 1190;
    state.boat.y = 500;
    return;
  }
  if (shot === 'lose') {
    world.start(seed);
    state.phase = 'lost';
    state.score = 180;
    state.level = 2;
    state.timeLeft = 0;
    state.lives = 0;
    state.carried = 2;
    state.collected = 16;
    state.delivered = 5;
    state.boat.x = 640;
    state.boat.y = 420;
    return;
  }
  // Unknown ?shot value: leave the start screen alone.
}
