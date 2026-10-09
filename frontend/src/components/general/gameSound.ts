const FILES = {
  correct: 'correct.wav',
  incorrect: 'incorrect.wav',
  win: 'win.wav',
  streak: 'streak.mp3',
} as const;

export type GameSound = keyof typeof FILES;

const cache: Partial<Record<GameSound, HTMLAudioElement>> = {};

const load = (name: GameSound) =>
  (cache[name] ??= Object.assign(
    new Audio(`${import.meta.env.BASE_URL}sounds/${FILES[name]}`),
    { preload: 'auto' },
  ));

/** Plays a game event sound on its own element, so rapid events overlap. Resolves when it ends (or can't play). */
export function playSound(name: GameSound): Promise<void> {
  const clone = load(name).cloneNode() as HTMLAudioElement;
  return new Promise((resolve) => {
    clone.addEventListener('ended', () => resolve(), { once: true });
    clone.play().catch(() => resolve());
  });
}

/** Warms the sound cache so the first event isn't late. */
export const preloadGameSounds = () =>
  (Object.keys(FILES) as GameSound[]).forEach(load);
