import { useRef, type MouseEvent } from 'react'

/** viewport coordinates, e.g. to spawn effects from the pressed button */
export type Point = { x: number; y: number }

/** Remembers the center of the last clicked element: pass `onClick` to the button, read `origin.current` on submit. */
export function useClickOrigin() {
  const origin = useRef<Point>({ x: 0, y: 0 })
  const onClick = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  return { origin, onClick }
}
