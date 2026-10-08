// Generates one wav per (text, language) pair into a folder, fully offline with espeak-ng.
//
//   sudo dnf install espeak-ng      # or: apt install espeak-ng
//   node scripts/generate-audio.mjs [output_folder]
//
// The language is an espeak-ng voice name (`espeak-ng --voices` lists them). Every string is
// rendered once per entry of VARIATIONS: a voice variant (`espeak-ng --voices=variant`), speed
// in words per minute (default 175) and pitch (0-99, default 50).
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

// [text, espeak-ng voice]
const STRINGS = [
  ['left', 'en'],
  ['right', 'en'],
  ['esquerda', 'pt'],
  ['direita', 'pt'],
  ['izquierda', 'es'],
  ['derecha', 'es'],
];

const VARIATIONS = [
  { name: 'm1', variant: 'm1', speed: 175, pitch: 50 },
  { name: 'm3-fast', variant: 'm3', speed: 210, pitch: 40 },
  { name: 'f2', variant: 'f2', speed: 165, pitch: 60 },
  { name: 'f4-slow', variant: 'f4', speed: 140, pitch: 70 },
];

const slug = (text) =>
  text
    .normalize('NFKD')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const out = process.argv[2] ?? 'assets/audio';
mkdirSync(out, { recursive: true });

for (const [text, lang] of STRINGS) {
  for (const { name, variant, speed, pitch } of VARIATIONS) {
    const file = join(out, `${lang}/${slug(text)}/${name}.wav`);
    mkdirSync(dirname(file), { recursive: true });
    execFileSync('espeak-ng', [
      '-v',
      `${lang}+${variant}`,
      '-s',
      String(speed),
      '-p',
      String(pitch),
      '-w',
      file,
      text,
    ]);
    console.log(file);
  }
}
