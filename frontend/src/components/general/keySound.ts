import type { MouseEvent } from 'react';

const url = (name: string) =>
  `${import.meta.env.BASE_URL}sounds/keyboard/${name}.wav`;

const SOURCES = {
  press: ['click1', 'click2'].map(url),
  release: ['release1', 'release2'].map(url),
};

type Kind = keyof typeof SOURCES;

/** playback volume per kind, 0 to 1 */
const VOLUME: Record<Kind, number> = { press: 0.3, release: 0.3 };

// shared by every button, created on first use
let pools: Record<Kind, HTMLAudioElement[]> | null = null;

const load = () =>
  (pools ??= {
    press: SOURCES.press.map(preload),
    release: SOURCES.release.map(preload),
  });

function preload(src: string) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
}

/** Plays a random sound of `kind` on its own element, so fast presses overlap. */
function play(kind: Kind) {
  const pool = load()[kind];
  const clone = pool[
    Math.floor(Math.random() * pool.length)
  ].cloneNode() as HTMLAudioElement;
  clone.volume = VOLUME[kind];
  clone.play().catch(() => {});
}

/** Warms the sound cache so the first press isn't late. */
export const preloadKeySounds = () => void load();

/**
 * Props that make a button sound like a key: `press` on pointer down, `release` when the click takes effect.
 * Spread them on the element; pass its click handler to keep it.
 */
export function keySoundProps<T extends HTMLElement = HTMLButtonElement>(
  onClick?: (e: MouseEvent<T>) => void,
) {
  return {
    onPointerDown: () => play('press'),
    onClick: (e: MouseEvent<T>) => {
      play('release');
      onClick?.(e);
    },
  };
}
