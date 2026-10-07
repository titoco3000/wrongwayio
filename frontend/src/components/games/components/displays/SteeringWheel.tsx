import { useEffect, useRef } from 'react'
import './SteeringWheel.css'

/** Largest wheel rotation either way, in degrees (keep below 180). */
const MAX_ANGLE = 120
/** Degrees per second the wheel follows the mouse. */
const MAX_SPEED = 360
/** Degrees per second the wheel returns to 0 after release. */
const RETURN_SPEED = 60
/** Longest frame time (seconds) that is integrated. */
const MAX_DT = 0.1
/** Presses closer to the centre than this (fraction of the touch zone radius) are ignored. */
const DEAD_ZONE = 0.1

/** Wraps a degree difference into -180..180. */
const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180
const clamp = (v: number) => Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, v))

type Props = {
  /** Called every frame with the steering amount, -1 (left) .. 1 (right). */
  onSteer: (steer: number) => void
}

export default function SteeringWheel({ onSteer }: Props) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const onSteerRef = useRef(onSteer)
  onSteerRef.current = onSteer
  // Set while the wheel is held: the grabbed point's angle on the wheel and the
  // latest pointer angle around the wheel centre (0 = up, clockwise positive).
  const grab = useRef<{ offset: number; pointer: number } | null>(null)

  useEffect(() => {
    let angle = 0
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min((now - last) / 1000, MAX_DT)
      last = now
      const held = grab.current
      // Held: aim to put the grabbed point under the pointer. Released: aim at 0.
      const target = held ? clamp(angle + wrap(held.pointer - held.offset - angle)) : 0
      const step = (held ? MAX_SPEED : RETURN_SPEED) * dt
      angle += Math.max(-step, Math.min(step, target - angle))
      wheelRef.current?.style.setProperty('--wheel-angle', `${angle}deg`)
      onSteerRef.current(angle / MAX_ANGLE)
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const pointerAngle = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    const inside = Math.hypot(dx, dy) > (rect.width / 2) * DEAD_ZONE
    return inside ? (Math.atan2(dx, -dy) * 180) / Math.PI : null
  }

  const currentAngle = () =>
    parseFloat(wheelRef.current?.style.getPropertyValue('--wheel-angle') || '0')

  return (
    <div
      className="steering-wheel__zone"
      onPointerDown={(e) => {
        const pointer = pointerAngle(e)
        if (pointer === null) return
        e.currentTarget.setPointerCapture(e.pointerId)
        grab.current = { offset: pointer - currentAngle(), pointer }
      }}
      onPointerMove={(e) => {
        const pointer = pointerAngle(e)
        if (grab.current && pointer !== null) grab.current.pointer = pointer
      }}
      onPointerUp={() => (grab.current = null)}
      onPointerCancel={() => (grab.current = null)}
    >
      <div ref={wheelRef} className="steering-wheel">
        <svg viewBox="-50 -50 100 100" aria-hidden="true">
          <circle className="steering-wheel__rim" r="43" />
          <path className="steering-wheel__spoke" d="M-40 8 H-12 L0 0 L12 8 H40 M0 0 V43" />
          <circle className="steering-wheel__hub" r="11" />
          <rect className="steering-wheel__mark" x="-3" y="-51" width="6" height="16" rx="2" />
        </svg>
      </div>
    </div>
  )
}
