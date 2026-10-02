import { useEffect, useRef } from 'react';

const SOUNDS = [1, 2].map(
  (n) => `${import.meta.env.BASE_URL}sounds/keyboard/${n}.wav`,
);

/** Returns a function that plays a random key sound. Each call plays on its own element, so fast presses overlap. */
export function useKeySound() {
  const audios = useRef<HTMLAudioElement[]>([]);

  useEffect(() => {
    audios.current = SOUNDS.map((src) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      return audio;
    });
  }, []);

  return () => {
    const pool = audios.current;
    if (!pool.length) return;
    const clone = pool[
      Math.floor(Math.random() * pool.length)
    ].cloneNode() as HTMLAudioElement;
    clone.play().catch(() => {});
  };
}
