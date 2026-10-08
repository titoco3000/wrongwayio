import { useEffect, useRef, type RefObject } from 'react'
import './Speedometer.css'

/** The dial sweeps this many degrees either side of straight up. */
const SWEEP = 135
const CENTER = 50
const RADIUS = 40

type Props = {
  /** Current speed multiplier, read every frame. Reverse shows as its absolute value. */
  speedRef: RefObject<number>
  /** Speed at the end of the dial. */
  max: number
  /** Speeds to put a tick at. */
  marks: number[]
}

const angleOf = (speed: number, max: number) =>
  -SWEEP + 2 * SWEEP * Math.min(Math.abs(speed) / max, 1)

const polar = (angle: number, r: number) => {
  const rad = (angle * Math.PI) / 180
  return { x: CENTER + Math.sin(rad) * r, y: CENTER - Math.cos(rad) * r }
}

export default function Speedometer({ speedRef, max, marks }: Props) {
  const needleRef = useRef<SVGLineElement>(null)

  useEffect(() => {
    let frame = requestAnimationFrame(function tick() {
      needleRef.current?.setAttribute(
        'transform',
        `rotate(${angleOf(speedRef.current, max)} ${CENTER} ${CENTER})`,
      )
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [speedRef, max])

  const start = polar(-SWEEP, RADIUS)
  const end = polar(SWEEP, RADIUS)
  return (
    <svg className="speedometer" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="speedometer__face" cx={CENTER} cy={CENTER} r="48" />
      <path
        className="speedometer__arc"
        d={`M${start.x} ${start.y} A${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`}
      />
      {marks.map((speed) => {
        const angle = angleOf(speed, max)
        const a = polar(angle, RADIUS - 8)
        const b = polar(angle, RADIUS + 3)
        return <line key={speed} className="speedometer__mark" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      })}
      <line
        ref={needleRef}
        className="speedometer__needle"
        x1={CENTER}
        y1={CENTER}
        x2={CENTER}
        y2={CENTER - RADIUS + 4}
        transform={`rotate(${-SWEEP} ${CENTER} ${CENTER})`}
      />
      <circle className="speedometer__hub" cx={CENTER} cy={CENTER} r="5" />
    </svg>
  )
}
