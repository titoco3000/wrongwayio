import { useEffect, useRef, useState, type CSSProperties } from 'react'
import crossroads from '../../../../../assets/crossroads.png'
import back from '../../../../../assets/back.png'
import './RenderRoad.css'

export const ROAD_COLS = 5
export const ROAD_ROWS = 3

/** Turn value units per second at full slider speed. */
const TURN_RATE = 1
/** Smallest turn speed (slider units, 0..1) the road is ever allowed to have. */
const MIN_SPEED = 0.3
/** Longest frame time (seconds) that is integrated. */
const MAX_DT = 0.1

export type RoadTile = {
  type: 'road' | 'back'
  /** Rotation in degrees, applied around `origin`. */
  rotation?: number
  /** CSS transform-origin, e.g. "50% 50%" or "top left". */
  origin?: string
}

const R = (rotation: number): RoadTile => ({ type: 'road', rotation })
const B = (rotation: number): RoadTile => ({ type: 'back', rotation })

const DEFAULT_TILES: (RoadTile | undefined)[] = [
  R(-90), R(0),   B(0),   R(0),   R(90),
  B(-90), R(-90), R(0),   R(90),  B(90),
  R(-90), R(180), R(180), R(180), R(90),
]

type Props = {
  /**
   * Row-major, ROAD_COLS * ROAD_ROWS entries. Missing/undefined entries are
   * filled with a standing back tile.
   */
  tiles?: (RoadTile | undefined)[]
}

export default function RenderRoad({ tiles = DEFAULT_TILES }: Props) {
  // The slider sets the turn speed (-1..1). The turn value (-1..1, which the
  // CSS derives camera position and rotation from) is integrated every frame.
  const [speed, setSpeed] = useState(0)
  const [topDown, setTopDown] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    let value = 0
    let last = performance.now()
    // Direction picked while the slider sits at exactly 0; kept until it moves.
    let zeroDirection = 0
    let frame = requestAnimationFrame(function tick(now) {
      // Scale by elapsed time so speed is the same at any refresh rate; cap it
      // so a backgrounded tab doesn't jump on return.
      const dt = Math.min((now - last) / 1000, MAX_DT)
      last = now
      const slider = speedRef.current
      let direction = Math.sign(slider)
      if (direction === 0) {
        zeroDirection ||= Math.random() < 0.5 ? -1 : 1
        direction = zeroDirection
      } else {
        zeroDirection = 0
      }
      // The road never stands still: at least MIN_SPEED in the chosen direction.
      const speed = direction * Math.max(Math.abs(slider), MIN_SPEED)
      value += speed * TURN_RATE * dt
      // Completed a full turn: start over from straight ahead.
      if (Math.abs(value) >= 1) value = 0
      rootRef.current?.style.setProperty('--road-value', String(value))
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className={`render-road${topDown ? ' render-road--top' : ''}`} ref={rootRef}>
      <div className="render-road__surface">
        <div
          className="render-road__grid"
          style={{ '--cols': ROAD_COLS, '--rows': ROAD_ROWS } as CSSProperties}
        >
          {Array.from({ length: ROAD_COLS * ROAD_ROWS }, (_, i) => {
            const tile = tiles[i] ?? { type: 'back' as const }
            const standing = tile.type === 'back'
            // Back tiles stand on the far (top) edge of their cell at rotation 0.
            // Rotating around the cell centre carries that edge to the left
            // (-90), right (90) or near (180) side.
            const origin = tile.origin ?? '50% 50%'
            // --road-stand (see the CSS) lays back tiles flat in top-down mode.
            const transform = `rotate(${tile.rotation ?? 0}deg)${
              standing ? ' var(--road-stand)' : ''
            }`
            return (
              <div
                key={i}
                className={`render-road__tile render-road__tile--${tile.type}`}
                style={{ transformOrigin: origin, transform }}
              >
                <img src={standing ? back : crossroads} alt="" draggable={false} />
              </div>
            )
          })}
          {/* Top-down only: where the camera is and which way it faces. */}
          <div className="render-road__camera">
            <svg className="render-road__arrow" viewBox="0 0 50 100" aria-hidden="true">
              <path d="M25 0 L50 40 H33 V100 H17 V40 H0 Z" />
            </svg>
          </div>
        </div>
      </div>
      <label className="render-road__toggle">
        <input type="checkbox" checked={topDown} onChange={(e) => setTopDown(e.target.checked)} />
        Top-down view
      </label>
      <input
        type="range"
        min={-1}
        max={1}
        step={0.01}
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="render-road__slider"
      />
    </div>
  )
}
