// Drawing for Firefly Ferry: river, moon, boat, docks, HUD and screens.
// One job: turn the world state into one readable night-river picture.
// Everything here is drawn in code — no image files, no fonts fetched.

import { GAME, PALETTE, VIEW } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSkyAndRiver(ctx, state, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 210);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, 210);

  state.stars.forEach((s) => {
    ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(t * 0.8 + s.tw));
    ctx.fillStyle = '#fff8d6';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Moon with a soft halo, and its shimmering path on the water.
  ctx.fillStyle = PALETTE.moonGlow;
  ctx.beginPath();
  ctx.arc(1060, 92, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.moon;
  ctx.beginPath();
  ctx.arc(1060, 92, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 190, 220, 0.5)';
  ctx.beginPath();
  ctx.arc(1048, 82, 8, 0, Math.PI * 2);
  ctx.arc(1072, 102, 6, 0, Math.PI * 2);
  ctx.fill();

  const river = ctx.createLinearGradient(0, 150, 0, VIEW.height);
  river.addColorStop(0, PALETTE.riverTop);
  river.addColorStop(1, PALETTE.riverBottom);
  ctx.fillStyle = river;
  ctx.fillRect(0, 150, VIEW.width, VIEW.height - 150);

  ctx.strokeStyle = 'rgba(255, 233, 168, 0.18)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const y = 210 + i * 90;
    ctx.beginPath();
    for (let x = 980; x < 1150; x += 14) {
      const yy = y + Math.sin(x * 0.05 + t * 1.4 + i) * 4;
      if (x === 980) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // Banks, reeds and lily pads frame the playable river.
  ctx.fillStyle = PALETTE.bank;
  ctx.fillRect(0, 150, 46, VIEW.height - 150);
  ctx.fillRect(VIEW.width - 46, 150, 46, VIEW.height - 150);
  ctx.fillStyle = PALETTE.reed;
  for (let x = 8; x < VIEW.width; x += 46) {
    const h = 26 + 10 * Math.sin(x * 0.7 + t);
    ctx.fillRect(x, 168 - h * 0.4, 4, h);
    ctx.fillRect(VIEW.width - x - 12, 168 - h * 0.4, 4, h);
  }
  state.lilies.forEach((l) => {
    ctx.fillStyle = PALETTE.lily;
    ctx.beginPath();
    ctx.arc(l.x, l.y + Math.sin(t + l.phase) * 2, l.r, 0.3, Math.PI * 2 - 0.3);
    ctx.lineTo(l.x, l.y);
    ctx.fill();
    if (l.flower) {
      ctx.fillStyle = PALETTE.lilyFlower;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(l.x + Math.cos(a) * 6, l.y + Math.sin(a) * 6 - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(l.x, l.y - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawDock(ctx, dock, ready) {
  const glow = ready ? 0.55 + 0.3 * Math.sin(dock.pulse) : 0.18;
  ctx.fillStyle = `rgba(126, 240, 212, ${glow})`;
  ctx.beginPath();
  ctx.arc(dock.x, dock.y, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2c1e';
  ctx.fillRect(dock.x - 34, dock.y - 10, 68, 20);
  ctx.fillStyle = PALETTE.dock;
  ctx.fillRect(dock.x - 34, dock.y - 12, 68, 5);
  // Little lantern posts at each end of the dock.
  [-28, 28].forEach((dx) => {
    ctx.fillStyle = '#3a2c1e';
    ctx.fillRect(dock.x + dx - 2, dock.y - 26, 4, 18);
    ctx.fillStyle = ready ? '#ffe9a8' : '#9fb8c8';
    ctx.beginPath();
    ctx.arc(dock.x + dx, dock.y - 30, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = ready ? '#0b1030' : '#dfe9ef';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ready ? 'DELIVER!' : 'DOCK', dock.x, dock.y + 34);
}

function drawBoat(ctx, boat, invulnerable, t) {
  // Wake trail.
  boat.trail.forEach((pt) => {
    ctx.globalAlpha = pt.life * 0.5;
    ctx.fillStyle = PALETTE.foam;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y + 8, 5 + (0.5 - pt.life) * 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  if (invulnerable > 0 && Math.floor(t * 10) % 2 === 0) ctx.globalAlpha = 0.45;

  ctx.save();
  ctx.translate(boat.x, boat.y);
  ctx.rotate(boat.angle + Math.PI / 2);
  // Hull: a little wooden ferry with a lantern on its prow.
  ctx.fillStyle = PALETTE.boatHull;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.quadraticCurveTo(20, -10, 18, 14);
  ctx.quadraticCurveTo(0, 26, -18, 14);
  ctx.quadraticCurveTo(-20, -10, 0, -26);
  ctx.fill();
  ctx.fillStyle = PALETTE.boatTrim;
  ctx.fillRect(-18, -4, 36, 4);
  ctx.fillStyle = '#5d3a1e';
  ctx.fillRect(-12, 2, 24, 10);
  ctx.fillStyle = PALETTE.lanternGlow;
  ctx.beginPath();
  ctx.arc(0, -30, 16 + 2 * Math.sin(t * 3), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.lantern;
  ctx.beginPath();
  ctx.arc(0, -30, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(0, -30, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 16, 14, 1248, 62, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, 34, 44);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.fillText(`/ ${GAME.targetScore} to win the night`, 190, 44);

  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const timeColour = state.timeLeft <= 15 ? PALETTE.danger : PALETTE.hudText;
  ctx.fillStyle = timeColour;
  ctx.fillText(`TIME ${Math.ceil(state.timeLeft)}s`, 640, 44);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`LEVEL ${state.level}`, 640, 66);

  ctx.textAlign = 'right';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.danger;
  ctx.fillText('♥'.repeat(Math.max(state.lives, 0)) + '♡'.repeat(Math.max(GAME.startLives - state.lives, 0)), 1010, 42);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Carried ✦ ${state.carried}/${GAME.deliverNeed}`, 1010, 66);
  ctx.fillStyle = state.combo > 1 ? PALETTE.hudAccent : 'rgba(244,241,222,0.55)';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.combo > 1 ? `COMBO ×${state.combo}` : 'COMBO —', 1060, 44);
  // Dash cooldown bar.
  const dashReady = state.dashCooldown <= 0;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, 1060, 54, 120, 8, 4);
  ctx.fill();
  ctx.fillStyle = dashReady ? PALETTE.good : PALETTE.hudAccent;
  const frac = dashReady ? 1 : 1 - state.dashCooldown / GAME.dashCooldown;
  roundRect(ctx, 1060, 54, 120 * frac, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(244,241,222,0.7)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('SPACE', 1186, 62);

  // The hint bar only belongs to live play: on the end screens the timer
  // that fades it never runs, so it would linger over the result.
  if (state.phase === 'playing' && state.message && state.messageTimer > 0) {
    ctx.globalAlpha = Math.min(1, state.messageTimer);
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, 390, 88, 500, 36, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.hudAccent;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, 640, 112);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 10, 24, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 290, 150, 700, 420, 20);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  roundRect(ctx, 290, 150, 700, 420, 20);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 240);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '20px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, 640, 300 + i * 36);
  });
}

export function render(ctx, state, t) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawSkyAndRiver(ctx, state, t);

  const ready = state.carried >= GAME.deliverNeed;
  state.docks.forEach((dock) => drawDock(ctx, dock, ready));

  state.rocks.forEach((r) => {
    ctx.fillStyle = PALETTE.rock;
    ctx.beginPath();
    ctx.arc(r.x, r.y + Math.sin(r.wobble) * 1.5, r.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(r.x - r.r * 0.3, r.y - r.r * 0.35, r.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.foam;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r + 4, 0.4, 2.2);
    ctx.stroke();
  });

  state.logs.forEach((log) => {
    ctx.save();
    ctx.translate(log.x, log.y);
    ctx.rotate(log.angle);
    ctx.fillStyle = PALETTE.log;
    roundRect(ctx, -log.len / 2, -11, log.len, 22, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-log.len / 2 + 8, -11, log.len - 16, 5);
    ctx.fillStyle = '#3d2a18';
    ctx.beginPath();
    ctx.arc(-log.len / 2, 0, 8, 0, Math.PI * 2);
    ctx.arc(log.len / 2, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  state.fireflies.forEach((f) => {
    const glow = 0.5 + 0.4 * Math.sin(f.phase * 2);
    ctx.fillStyle = `rgba(216, 255, 122, ${glow * 0.45})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.firefly;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1030';
    ctx.beginPath();
    ctx.arc(f.x - 2, f.y - 1, 1.4, 0, Math.PI * 2);
    ctx.arc(f.x + 2, f.y - 1, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });

  state.particles.forEach((p) => {
    ctx.globalAlpha = Math.max(p.life / p.max, 0);
    ctx.fillStyle = p.colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (state.phase !== 'start') drawBoat(ctx, state.boat, state.invulnerable, t);

  if (state.phase === 'playing' || state.phase === 'paused') {
    drawHud(ctx, state);
    if (state.phase === 'paused') {
      drawOverlay(ctx, 'PAUSED', ['Take a breath, ferryman.', 'P to resume · R to restart'], PALETTE.hudAccent);
    }
    return;
  }

  if (state.phase === 'start') {
    drawOverlay(ctx, 'FIREFLY FERRY', [
      'Steer the little lantern boat down the night river.',
      'Catch fireflies ✦  Deliver 5 at a glowing dock for +25 each.',
      'Dodge rocks and drifting logs — 3 hearts, 90 seconds, 300 points to win.',
      'Move: WASD / arrows or hold the mouse · Dash: Space · Mute: M',
      '',
      'Press ENTER or click to set sail!',
    ], PALETTE.lantern);
    return;
  }

  if (state.phase === 'won') {
    drawHud(ctx, state);
    drawOverlay(ctx, 'THE RIVER GLOWS!', [
      `You won the night with ${state.score} points — best combo ×${state.bestCombo}.`,
      `${state.collected} fireflies caught · ${state.delivered} delivered to the docks.`,
      'Press R or click to sail again.',
    ], PALETTE.good);
    return;
  }

  if (state.phase === 'lost') {
    drawHud(ctx, state);
    const reason = state.lives <= 0 ? 'The ferry took one bump too many.' : 'Night fell before you reached 300 points.';
    drawOverlay(ctx, 'THE LANTERNS FADE…', [
      reason,
      `Score ${state.score} / ${GAME.targetScore} · ${state.collected} fireflies caught.`,
      'Press R or click to try the river again.',
    ], PALETTE.danger);
  }
}
