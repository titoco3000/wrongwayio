import BallDirectionDisplay from '../components/BallDirectionDisplay'
import DirectionButtonsInput from '../components/DirectionButtonsInput'
import DirectionGame, { type GameProps } from './DirectionGame'

/** Movement reaction: ball swipe, press the unlabeled button on its side */
export default function SwipeUnlabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={BallDirectionDisplay} Input={DirectionButtonsInput} />
}
