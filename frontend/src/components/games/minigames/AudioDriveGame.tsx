import AudioDisplay from '../components/displays/AudioDisplay'
import type { GameProps } from '../components/GameRound'
import { DriveWithDisplay } from './DriveGame'

/** A voice says a direction; steer the car out of the central tile through that side. */
export default function AudioDriveGame(props: GameProps) {
  return <DriveWithDisplay {...props} Display={AudioDisplay} displayHeight="min-h-40" />
}
