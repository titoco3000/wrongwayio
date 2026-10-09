import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import crossroads from '../../../../../assets/crossroads.png'
import back from '../../../../../assets/back.png'
import './RenderRoad.css'

export const ROAD_COLS = 5
export const ROAD_ROWS = 5

/** Degrees per second the heading changes at full steering. */
const TURN_RATE = 60
/** Speed in first gear, in main-tile widths per second. */
const FORWARD_SPEED = 0.1
/** Seconds for the speed to cover about 63% of the way to a newly selected gear's speed. */
const SPEED_RESPONSE = 0.6
/** Longest frame time (seconds) that is integrated. */
const MAX_DT = 0.1
/** Smallest Y the car reaches; getting there is a crash against the far edge. */
const CRASH_Y = 0.2
/**
 * Default distance from a side edge of the main tile (fraction of its width) at which the car
 * counts as having exited that way, so it doesn't have to reach the very edge.
 */
export const EXIT_MARGIN = 0.3
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
  /** Speed multiplier (negative = reverse), read every frame. */
  speedRef: RefObject<number>
  /** Written every frame with the speed multiplier actually driven (eases towards `speedRef`). */
  currentSpeedRef?: RefObject<number>
  /** Show the whole board from above instead of the driver's perspective. */
  topDown?: boolean
  /** The car left the main tile and was teleported back to the start. */
  onExit?: (side: ExitSide) => void
  /** The car reached the far edge of the main tile. Fires once per approach. */
  onCrash?: () => void
  /** Distance from a side edge, as a fraction of the tile, at which the car counts as exited. Default EXIT_MARGIN. */
  exitMargin?: number
}

/**
 * The image enlarged `UPSCALE` times with hard pixel edges. Close-up tiles then
 * stay sharp with normal smoothing, which (unlike `image-rendering: pixelated`)
 * doesn't shimmer on the far, tilted tiles while the board moves.
 *
 * Smoothing fades a tile's outermost texels into transparency, which shows as
 * a seam between tiles. So the result also carries `EDGE` extra texels on each
 * side, copied from the border: the fade happens out there, under the
 * neighbouring tile. `bleed` is that margin as a fraction of the tile size.
 */
const UPSCALE = 8
const EDGE = 2
type Upscaled = { url: string; bleed: number }
function useUpscaled(src: string): Upscaled {
  const [result, setResult] = useState<Upscaled>({ url: src, bleed: 0 })
  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth * UPSCALE
      const h = img.naturalHeight * UPSCALE
      const canvas = document.createElement('canvas')
      canvas.width = w + 2 * EDGE
      canvas.height = h + 2 * EDGE
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, EDGE, EDGE, w, h)
      // Sides first, then top and bottom over the full width, which fills the corners.
      ctx.drawImage(canvas, EDGE, EDGE, 1, h, 0, EDGE, EDGE, h)
      ctx.drawImage(canvas, EDGE + w - 1, EDGE, 1, h, EDGE + w, EDGE, EDGE, h)
      ctx.drawImage(canvas, 0, EDGE, canvas.width, 1, 0, 0, canvas.width, EDGE)
      ctx.drawImage(canvas, 0, EDGE + h - 1, canvas.width, 1, 0, EDGE + h, canvas.width, EDGE)
      if (!cancelled) setResult({ url: canvas.toDataURL(), bleed: EDGE / w })
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])
  return result
}

export default function RenderRoad({ tiles = DEFAULT_TILES, steerRef, speedRef, currentSpeedRef, topDown = false, onExit, onCrash, exitMargin = EXIT_MARGIN }: Props) {
  // `steerRef` steers (-1..1). The gear (`speedRef`) sets the speed. The car stays inside the
  // main tile; leaving it sideways resets it to the start and rotates its
  // heading by 90deg, so it stays in the central tile while the world seems to
  // move.
  const rootRef = useRef<HTMLDivElement>(null)
  const roadTex = useUpscaled(crossroads)
  const backTex = useUpscaled(back)
  // Latest callbacks, so the animation loop never restarts when they change.
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit
  const onCrashRef = useRef(onCrash)
  onCrashRef.current = onCrash
  const marginRef = useRef(exitMargin)
  marginRef.current = exitMargin

  useEffect(() => {
    let x = START_X
    let y = START_Y
    // Degrees, 0 = straight up, positive = towards the right.
    let heading = START_HEADING
    let crashed = false
    // Lowest Y that counts as out through the bottom. After a side exit the car re-enters from the
    // tile it left, `exitMargin` below the bottom edge, so the world doesn't jump; this is raised until it is back inside.
    let bottomY = RESPAWN_Y
    // Multiplier actually driven; eases towards `speedRef` instead of jumping.
    let gearSpeed = speedRef.current
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      // Scale by elapsed time so speed is the same at any refresh rate; cap it
      // so a backgrounded tab doesn't jump on return.
      const dt = Math.min((now - last) / 1000, MAX_DT)
      last = now
      heading += steerRef.current * TURN_RATE * dt
      const rad = (heading * Math.PI) / 180
      // Pushing against the wall, the car slows to a stop instead of keeping its gear's speed.
      const targetSpeed = crashed ? 0 : speedRef.current
      gearSpeed += (targetSpeed - gearSpeed) * (1 - Math.exp(-dt / SPEED_RESPONSE))
      const speed = FORWARD_SPEED * gearSpeed
      x += Math.sin(rad) * speed * dt
      y -= Math.cos(rad) * speed * dt
      if (y <= CRASH_Y) {
        y = CRASH_Y
        if (!crashed) onCrashRef.current?.()
        crashed = true
      } else {
        crashed = false
      }
      if (bottomY > RESPAWN_Y && y <= RESPAWN_Y) bottomY = RESPAWN_Y
      if (y > bottomY) {
        // Out through the bottom: mirror X and turn around.
        heading += 180
        x = 1 - x
        y = RESPAWN_Y
        bottomY = RESPAWN_Y
        onExitRef.current?.('back')
      } else if (bottomY === RESPAWN_Y && (x > 1 - marginRef.current || x < marginRef.current)) {
        // Out through the right turns the heading back left, and vice versa.
        // The old Y becomes the new X (mirrored when leaving left), as the
        // exit edge turns into the start edge.
        const right = x > 1 - marginRef.current
        const x0 = x
        heading -= right ? 90 : -90
        x = right ? y : 1 - y
        // still the distance short of the edge the car was when it exited
        y = RESPAWN_Y + (right ? 1 - x0 : x0)
        bottomY = y
        onExitRef.current?.(right ? 'right' : 'left')
      }
      if (currentSpeedRef) currentSpeedRef.current = gearSpeed
      const style = rootRef.current?.style
      style?.setProperty('--cam-x', `${((MAIN_COL + x) / ROAD_COLS) * 100}%`)
      style?.setProperty('--cam-y', `${((MAIN_ROW + y) / ROAD_ROWS) * 100}%`)
      style?.setProperty('--road-rot', `${-heading}deg`)
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [steerRef, speedRef, currentSpeedRef])

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
            const tex = standing ? backTex : roadTex
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
                <img
                  src={tex.url}
                  alt=""
                  draggable={false}
                  style={
                    tex.bleed
                      ? { width: `${(1 + 2 * tex.bleed) * 100}%`, height: `${(1 + 2 * tex.bleed) * 100}%`, margin: `${-tex.bleed * 100}%` }
                      : undefined
                  }
                />
              </div>
            )
          })}
          {/* Top-down only: where the car is and which way it faces. */}
          <div className="render-road__camera">
            <svg className="render-road__car" viewBox="0 0 50 100" aria-hidden="true">
              <rect className="render-road__car-wheel" x="1" y="16" width="8" height="22" rx="3" />
              <rect className="render-road__car-wheel" x="41" y="16" width="8" height="22" rx="3" />
              <rect className="render-road__car-wheel" x="1" y="64" width="8" height="22" rx="3" />
              <rect className="render-road__car-wheel" x="41" y="64" width="8" height="22" rx="3" />
              <rect className="render-road__car-body" x="5" y="2" width="40" height="96" rx="14" />
              <rect className="render-road__car-light" x="9" y="4" width="10" height="7" rx="3" />
              <rect className="render-road__car-light" x="31" y="4" width="10" height="7" rx="3" />
              <path className="render-road__car-glass" d="M11 34 Q25 28 39 34 L37 48 H13 Z" />
              <path className="render-road__car-glass" d="M13 70 H37 L39 80 Q25 85 11 80 Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
