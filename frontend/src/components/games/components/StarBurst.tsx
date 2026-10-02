import { useMemo, type CSSProperties } from 'react'

type Props = {
  /** viewport coordinates the stars fly out from */
  x: number
  y: number
  onDone: () => void
  count?: number
}

const DURATION_MS = 800

/** One-shot burst of stars flying outwards from a point. Calls onDone when finished. */
export default function StarBurst({ x, y, onDone, count = 12 }: Props) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
        const dist = 70 + Math.random() * 80
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 30,
          rot: (Math.random() - 0.5) * 360,
          size: 14 + Math.random() * 14,
        }
      }),
    [count],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed z-40" style={{ left: x, top: y }}>
      {stars.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="star-fly absolute"
          style={
            {
              width: s.size,
              height: s.size,
              marginLeft: -s.size / 2,
              marginTop: -s.size / 2,
              '--dx': `${s.dx}px`,
              '--dy': `${s.dy}px`,
              '--rot': `${s.rot}deg`,
              animationDuration: `${DURATION_MS}ms`,
            } as CSSProperties
          }
          onAnimationEnd={i === 0 ? onDone : undefined}
        >
          <path
            d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.3l7.1-.7z"
            fill="#facc15"
            stroke="#a16207"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}
