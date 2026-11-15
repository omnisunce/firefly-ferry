# Firefly Ferry

A small original arcade game for make.fun best-game-01. Steer a little
lantern boat down a night river, catch fireflies, deliver them to the
glowing docks, and dodge rocks and drifting logs.

## How to play

- **Goal:** score **300 points** before the 90-second night ends.
- **Catch fireflies** (+10 each, chained catches build a combo up to ×5).
- **Deliver:** carrying 5 or more, sail into a glowing dock — each
  delivered firefly is worth +25 points and +5 seconds.
- **Hazards:** rocks and drifting logs cost 1 heart (you have 3) and
  drop 2 carried fireflies. Lose all hearts, or run out of time
  below 300 points, and the lanterns fade.
- **Levels:** every 100 points the river quickens — more logs, faster
  current, more fireflies to chase.

## Controls

- Move: **WASD / arrow keys**, or **hold the mouse** to steer toward it
- Dash: **Space** (2-second cooldown)
- Pause: **P** · Restart: **R** · Mute: **M**
- Start / restart: **Enter** or click

## Running it

Serve `game/` with any static server and open `index.html` in desktop
Chrome — it plays fully offline, with no network requests. All art is
drawn in code and all sound is synthesised with WebAudio; there are no
image, font or audio files to fetch.

```sh
cd game && python3 -m http.server 8080   # then open http://localhost:8080
```

## Files

- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with `vendor/makefun-game.ts`.
- `game/index.html` — the page; `game/src/` is the game, one job per file:
  `config.js` (tuning + palette), `random.js` (seeded RNG),
  `input.js` (keyboard + mouse), `audio.js` (synth sounds),
  `world.js` (entities, spawning, collisions, win/lose),
  `render.js` (all drawing, HUD and screens), `shots.js`
  (deterministic screenshot states), `main.js` (loop + state machine).
- `screenshots/` — 4 real renders of the game's own code: start, play,
  win, lose (the first by name is the cover). Each is stored as a `.b64`
  text file (base64 of the JPEG) so the entry travels through text-only
  pushes; `main.ts` decodes them into real JPEGs in `/output`.

## License

MIT — see `LICENSE`.
