import { useRef } from 'react'
import RenderRoad from './RenderRoad'
import SteeringWheel from './SteeringWheel'
import './Drive.css'

export default function Drive() {
  const steerRef = useRef(0)
  return (
    <div className="drive">
      <RenderRoad steerRef={steerRef} />
      <div className="drive__wheel">
        <SteeringWheel onSteer={(steer) => (steerRef.current = steer)} />
      </div>
    </div>
  )
}
