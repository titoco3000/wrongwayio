import { useRef } from 'react'
import RenderRoad, { type ExitSide } from './RenderRoad'
import SteeringWheel from './SteeringWheel'
import './Drive.css'

type Props = {
  /** The car left the central tile (and was teleported back to the start). */
  onExit?: (side: ExitSide) => void
  /** The car reached the far edge of the central tile. */
  onCrash?: () => void
}

export default function Drive({ onExit, onCrash }: Props) {
  const steerRef = useRef(0)
  return (
    <div className="drive">
      <RenderRoad steerRef={steerRef} onExit={onExit} onCrash={onCrash} />
      <div className="drive__wheel">
        <SteeringWheel onSteer={(steer) => (steerRef.current = steer)} />
      </div>
    </div>
  )
}
