// Firefly Ferry — tuning constants and the night-river palette.
// One job: every number and colour the rest of the game agrees on.

export const VIEW = { width: 1280, height: 720 };

export const GAME = {
  targetScore: 300,
  startTime: 90,
  startLives: 3,
  deliverNeed: 5,
  deliverBonus: 25,
  deliverTimeBonus: 5,
  fireflyScore: 10,
  comboWindow: 3,
  maxCombo: 5,
  dashCooldown: 2,
  dashSpeed: 620,
  boatRadius: 22,
  invulnerableTime: 1.5,
};

export const PALETTE = {
  skyTop: '#0b1030',
  skyBottom: '#1b2a52',
  riverTop: '#16324a',
  riverBottom: '#0a1f33',
  moon: '#ffe9a8',
  moonGlow: 'rgba(255, 233, 168, 0.35)',
  bank: '#122b1e',
  reed: '#2e6b4f',
  lily: '#2f7a4e',
  lilyFlower: '#ff9ecf',
  boatHull: '#8a5a33',
  boatTrim: '#ffd166',
  lantern: '#ffb703',
  lanternGlow: 'rgba(255, 183, 3, 0.45)',
  firefly: '#d8ff7a',
  fireflyGlow: 'rgba(216, 255, 122, 0.5)',
  dock: '#7ef0d4',
  rock: '#5b6470',
  log: '#6b4a2f',
  foam: 'rgba(190, 230, 255, 0.5)',
  hudPanel: 'rgba(6, 14, 30, 0.72)',
  hudText: '#f4f1de',
  hudAccent: '#ffd166',
  danger: '#ff6b6b',
  good: '#7ef0d4',
};

export const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  dash: ['Space'],
  start: ['Enter'],
  restart: ['KeyR'],
  pause: ['KeyP'],
  mute: ['KeyM'],
};
