// Firefly Ferry — the entry program for make.fun best-game-01.
// Node 22, standard library only. It hands the game in: copy this
// repository's game/ into the output directory, decode its screenshots
// into real JPEGs there, and write dossier.json with the vendored make.fun
// library, so the sealed scorer can check the game and the judge can read
// its outline. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program is deterministic: two runs write byte-identical output,
// because it only copies files, decodes fixed base64 and builds the
// dossier from them. The repository keeps each screenshot as a `.b64` text
// file (base64 of the JPEG) so the whole entry travels through text-only
// pushes; the images the judge sees are the decoded JPEGs in /output.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function isImage(bytes: Buffer): boolean {
  const jpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return jpeg || png;
}

function handInScreenshots(fromDir: string, toDir: string): void {
  mkdirSync(toDir, { recursive: true });
  for (const name of readdirSync(fromDir).sort()) {
    const src = join(fromDir, name);
    if (name.endsWith('.b64')) {
      const imageName = name.slice(0, -'.b64'.length);
      const bytes = Buffer.from(readFileSync(src, 'utf8').replace(/\s+/g, ''), 'base64');
      if (!isImage(bytes)) throw new Error(`screenshots/${name}: decoded bytes are not a PNG or JPEG`);
      writeFileSync(join(toDir, imageName), bytes);
    } else {
      const bytes = readFileSync(src);
      if (!isImage(bytes)) throw new Error(`screenshots/${name}: not a PNG or JPEG`);
      writeFileSync(join(toDir, name), bytes);
    }
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  handInScreenshots(join(here, 'screenshots'), join(out, 'screenshots'));
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
