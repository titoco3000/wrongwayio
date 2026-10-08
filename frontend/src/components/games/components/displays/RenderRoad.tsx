import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import crossroads from '../../../../../assets/crossroads.png'
import back from '../../../../../assets/back.png'
import './RenderRoad.css'

export const ROAD_COLS = 5
export const ROAD_ROWS = 5

/** Degrees per second the heading changes at full steering. */
const TURN_RATE = 60
/** Forward speed, in main-tile widths per second. */
const FORWARD_SPEED = 0.1
/** Longest frame time (seconds) that is integrated. */
const MAX_DT = 0.1
/** Smallest Y the car reaches; getting there is a crash against the far edge. */
const CRASH_Y = 0.2
/** Car start inside the main tile (0..1 each axis, y grows downwards). */
const START_X = 0.66
const START_Y = 0.5
/** Y the car re-enters at after leaving the main tile (the bottom edge). */
const RESPAWN_Y = 1
/** Start heading in degrees, 90 = pointing right. */
const START_HEADING = 90
/** The main tile: centre tile (a road row and a back-tile row sit below). */
const MAIN_COL = Math.floor(ROAD_COLS / 2)
const MAIN_ROW = Math.floor(ROAD_ROWS / 2)

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
  B(0),   B(0),   B(0),   B(0),   B(0),
  R(-90), R(0),   B(0),   R(0),   R(90),
  B(-90), R(-90), R(0),   R(90),  B(90),
  R(-90), R(180), R(180), R(180), R(90),
  B(180), B(180), B(180), B(180), B(180),
]

/** Edge of the main tile the car left through. */
export type ExitSide = 'left' | 'right' | 'back'

type Props = {
  /**
   * Row-major, ROAD_COLS * ROAD_ROWS entries. Missing/undefined entries are
   * filled with a standing back tile.
   */
  tiles?: (RoadTile | undefined)[]
  /** Steering amount, -1 (left) .. 1 (right), read every frame. */
  steerRef: RefObject<number>
  /** The car left the main tile and was teleported back to the start. */
  onExit?: (side: ExitSide) => void
  /** The car reached the far edge of the main tile. Fires once per approach. */
  onCrash?: () => void
}

export default function RenderRoad({ tiles = DEFAULT_TILES, steerRef, onExit, onCrash }: Props) {
  // `steerRef` steers (-1..1). The car always drives forward inside the
  // main tile; leaving it sideways resets it to the start and rotates its
  // heading by 90deg, so it stays in the central tile while the world seems to
  // move.
  const [topDown, setTopDown] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  // Latest callbacks, so the animation loop never restarts when they change.
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit
  const onCrashRef = useRef(onCrash)
  onCrashRef.current = onCrash

  useEffect(() => {
    let x = START_X
    let y = START_Y
    // Degrees, 0 = straight up, positive = towards the right.
    let heading = START_HEADING
    let crashed = false
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      // Scale by elapsed time so speed is the same at any refresh rate; cap it
      // so a backgrounded tab doesn't jump on return.
      const dt = Math.min((now - last) / 1000, MAX_DT)
      last = now
      heading += steerRef.current * TURN_RATE * dt
      const rad = (heading * Math.PI) / 180
      x += Math.sin(rad) * FORWARD_SPEED * dt
      y -= Math.cos(rad) * FORWARD_SPEED * dt
      if (y <= CRASH_Y) {
        y = CRASH_Y
        if (!crashed) onCrashRef.current?.()
        crashed = true
      } else {
        crashed = false
      }
      if (y > 1) {
        // Out through the bottom: mirror X and turn around.
        heading += 180
        x = 1 - x
        y = RESPAWN_Y
        onExitRef.current?.('back')
      } else if (x > 1 || x < 0) {
        // Out through the right turns the heading back left, and vice versa.
        // The old Y becomes the new X (mirrored when leaving left), as the
        // exit edge turns into the start edge.
        const right = x > 1
        heading -= right ? 90 : -90
        x = right ? y : 1 - y
        y = RESPAWN_Y
        onExitRef.current?.(right ? 'right' : 'left')
      }
      const style = rootRef.current?.style
      style?.setProperty('--cam-x', `${((MAIN_COL + x) / ROAD_COLS) * 100}%`)
      style?.setProperty('--cam-y', `${((MAIN_ROW + y) / ROAD_ROWS) * 100}%`)
      style?.setProperty('--road-rot', `${-heading}deg`)
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [steerRef])

  return (
    <div className={`render-road${topDown ? ' render-road--top' : ''}`} ref={rootRef}>
      <label className="render-road__toggle">
        <input type="checkbox" checked={topDown} onChange={(e) => setTopDown(e.target.checked)} />
        Top-down view
      </label>
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
    </div>
  )
}
