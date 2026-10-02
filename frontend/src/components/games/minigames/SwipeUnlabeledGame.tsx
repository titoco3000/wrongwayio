import BallDirectionDisplay from '../components/displays/BallDirectionDisplay'
import DirectionButtonsInput from '../components/inputs/DirectionButtonsInput'
import DirectionGame, { type GameProps } from '../components/gameTypes/DirectionGame'

/** Movement reaction: ball swipe, press the unlabeled button on its side */
export default function SwipeUnlabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={BallDirectionDisplay} Input={DirectionButtonsInput} />
}
