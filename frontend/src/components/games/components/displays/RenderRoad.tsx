import { useState, type CSSProperties } from 'react'
import crossroads from '../../../../../assets/crossroads.png'
import back from '../../../../../assets/back.png'
import './RenderRoad.css'

export const ROAD_COLS = 5
export const ROAD_ROWS = 3

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
  // -1..1; the CSS derives camera position and rotation from it.
  const [value, setValue] = useState(0)
  return (
    <div className="render-road" style={{ '--road-value': value } as CSSProperties}>
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
            const transform = `rotate(${tile.rotation ?? 0}deg)${
              standing ? ' translateY(50%) rotateX(-90deg) translateY(-50%)' : ''
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
        </div>
      </div>
      <input
        type="range"
        min={-1}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="render-road__slider"
      />
    </div>
  )
}
