import { useRef } from 'react'
import RenderRoad, { type ExitSide } from './RenderRoad'
import SteeringWheel from './SteeringWheel'
import GearShifter, { START_GEAR, type Gear } from './GearShifter'
import './Drive.css'

/** Each forward gear is this much faster than the previous one. */
const GEAR_STEP = 1.4
/** Reverse speed, relative to first gear. */
const REVERSE = -0.4

/** Speed multiplier of a gear, relative to first gear. */
const gearSpeed = (gear: Gear) => {
  if (gear === 'R') return REVERSE
  return GEAR_STEP ** (Number(gear) - 1)
}

type Props = {
  /** The car left the central tile (and was teleported back to the start). */
  onExit?: (side: ExitSide) => void
  /** The car reached the far edge of the central tile. */
  onCrash?: () => void
}

export default function Drive({ onExit, onCrash }: Props) {
  const steerRef = useRef(0)
  const speedRef = useRef(gearSpeed(START_GEAR))
  return (
    <div className="drive">
      <RenderRoad steerRef={steerRef} speedRef={speedRef} onExit={onExit} onCrash={onCrash} />
      <div className="drive__wheel">
        <SteeringWheel onSteer={(steer) => (steerRef.current = steer)} />
      </div>
      <div className="drive__shifter">
        <GearShifter onGear={(gear) => (speedRef.current = gearSpeed(gear))} />
      </div>
    </div>
  )
}
