import { useEffect, useRef } from 'react'
import './GearShifter.css'

type Point = { x: number; y: number }
type Segment = { a: Point; b: Point }

const VIEW_W = 90
const VIEW_H = 96
const COLUMNS = [15, 45, 75]
const TOP = 20
const BOTTOM = 76
const NEUTRAL = (TOP + BOTTOM) / 2
const LABELS = [
  ['1', 15, TOP],
  ['2', 15, BOTTOM],
  ['3', 45, TOP],
  ['4', 45, BOTTOM],
  ['5', 75, TOP],
  ['R', 75, BOTTOM],
] as const

export type Gear = (typeof LABELS)[number][0]

export const START_GEAR: Gear = '1'

/** How close (view units) the lever must be to a column's end to engage that gear. */
const ENGAGE = 7

/** The gear whose slot end the lever is at, or null between gears. */
const gearAt = ({ x, y }: Point): Gear | null => {
  for (const [gear, gx, gy] of LABELS) {
    if (Math.hypot(x - gx, y - gy) <= ENGAGE) return gear
  }
  return null
}

/** Centre lines of the channels the lever slides in: the neutral gate and one path per column. */
const SEGMENTS: Segment[] = [
  { a: { x: COLUMNS[0], y: NEUTRAL }, b: { x: COLUMNS[2], y: NEUTRAL } },
  ...COLUMNS.map((x) => ({ a: { x, y: TOP }, b: { x, y: BOTTOM } })),
]
const PATH = SEGMENTS.map(({ a, b }) => `M${a.x} ${a.y} L${b.x} ${b.y}`).join(' ')

/** How far the red top leans away from the component centre, per unit the base is off-centre. */
const LEAN = 0.4
const CENTER: Point = { x: VIEW_W / 2, y: VIEW_H / 2 }

/** Where the red top sits for a lever base at `base`: pushed away from the centre. */
const topOf = (base: Point): Point => ({
  x: base.x + (base.x - CENTER.x) * LEAN,
  y: base.y + (base.y - CENTER.y) * LEAN,
})

/** Longest single collision step (view units); well below the channel spacing. */
const STEP = 1.5
/** Lever speed limit towards the pointer, in view units per second. */
const MAX_SPEED = 200
/** Longest frame time (seconds) that is integrated. */
const MAX_DT = 0.1
/** How far the lever may stray from a channel's centre line before it hits the wall. */
const SLACK = 4

const closestOn = ({ a, b }: Segment, p: Point): Point => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
  return { x: a.x + t * dx, y: a.y + t * dy }
}

/** `p` pushed back out of the walls: moved to the nearest spot within SLACK of a channel. */
const clampToChannels = (p: Point): Point => {
  let center = p
  let bestDist = Infinity
  for (const segment of SEGMENTS) {
    const c = closestOn(segment, p)
    const d = Math.hypot(c.x - p.x, c.y - p.y)
    if (d < bestDist) {
      center = c
      bestDist = d
    }
  }
  if (bestDist <= SLACK) return p
  const k = SLACK / bestDist
  return { x: center.x + (p.x - center.x) * k, y: center.y + (p.y - center.y) * k }
}

/** The spot on the rails' centre lines nearest to `p`: where the lever is drawn. */
const snapToRails = (p: Point): Point => {
  let best = p
  let bestDist = Infinity
  for (const segment of SEGMENTS) {
    const c = closestOn(segment, p)
    const d = Math.hypot(c.x - p.x, c.y - p.y)
    if (d < bestDist) {
      best = c
      bestDist = d
    }
  }
  return best
}

/** Moves the lever up to `distance` towards `target` in small steps, sliding along the walls. */
const pull = (from: Point, target: Point, distance: number): Point => {
  let pos = from
  let left = distance
  while (left > 0.001) {
    const dx = target.x - pos.x
    const dy = target.y - pos.y
    const dist = Math.hypot(dx, dy)
    if (dist < 0.01) break
    const len = Math.min(STEP, dist, left)
    const next = clampToChannels({ x: pos.x + (dx / dist) * len, y: pos.y + (dy / dist) * len })
    // Stuck against a wall: the remaining pull points straight into it.
    if (Math.hypot(next.x - pos.x, next.y - pos.y) < 0.01) break
    pos = next
    left -= len
  }
  return pos
}

type Props = {
  /** Called whenever the engaged gear changes. Between gears the last one stays engaged. */
  onGear?: (gear: Gear) => void
}

export default function GearShifter({ onGear }: Props) {
  const onGearRef = useRef(onGear)
  onGearRef.current = onGear
  const gear = useRef<Gear>(START_GEAR)
  const svgRef = useRef<SVGSVGElement>(null)
  const shaftRef = useRef<SVGLineElement>(null)
  const topRef = useRef<SVGGElement>(null)
  const baseRef = useRef<SVGCircleElement>(null)
  const lever = useRef<Point>({ x: COLUMNS[0], y: TOP })
  // Set while the lever is held: where the pointer wants the lever to be.
  const target = useRef<Point | null>(null)
  const grabOffset = useRef<Point>({ x: 0, y: 0 })

  const render = () => {
    const base = snapToRails(lever.current)
    const top = topOf(base)
    const engaged = gearAt(base)
    if (engaged && engaged !== gear.current) {
      gear.current = engaged
      onGearRef.current?.(engaged)
    }
    baseRef.current?.setAttribute('transform', `translate(${base.x} ${base.y})`)
    shaftRef.current?.setAttribute('x1', String(base.x))
    shaftRef.current?.setAttribute('y1', String(base.y))
    shaftRef.current?.setAttribute('x2', String(top.x))
    shaftRef.current?.setAttribute('y2', String(top.y))
    topRef.current?.setAttribute('transform', `translate(${top.x} ${top.y})`)
  }

  useEffect(() => {
    render()
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min((now - last) / 1000, MAX_DT)
      last = now
      if (target.current) {
        lever.current = pull(lever.current, target.current, MAX_SPEED * dt)
        render()
      }
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const toView = (e: React.PointerEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
    }
  }

  const release = () => (target.current = null)

  return (
    <svg
      ref={svgRef}
      className="gear-shifter"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      aria-hidden="true"
      onPointerDown={(e) => {
        const p = toView(e)
        const l = lever.current
        // Only the lever can be grabbed, by its top or base (with some slack for fingers).
        const t = topOf(l)
        if (Math.min(Math.hypot(p.x - l.x, p.y - l.y), Math.hypot(p.x - t.x, p.y - t.y)) > 12) return
        e.currentTarget.setPointerCapture(e.pointerId)
        grabOffset.current = { x: l.x - p.x, y: l.y - p.y }
        target.current = l
      }}
      onPointerMove={(e) => {
        if (!target.current) return
        const p = toView(e)
        target.current = { x: p.x + grabOffset.current.x, y: p.y + grabOffset.current.y }
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <path className="gear-shifter__groove" d={PATH} />
      <path className="gear-shifter__channel" d={PATH} />
      {LABELS.map(([label, x, y]) => (
        <text
          key={label}
          className="gear-shifter__label"
          x={x}
          y={y + (y === TOP ? -11 : 15)}
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
      <circle ref={baseRef} className="gear-shifter__pivot" r="7" />
      <line ref={shaftRef} className="gear-shifter__shaft" />
      <g ref={topRef}>
        <circle className="gear-shifter__knob" r="7" />
        <circle className="gear-shifter__shine" cx="-2.5" cy="-2.5" r="2.2" />
      </g>
    </svg>
  )
}
