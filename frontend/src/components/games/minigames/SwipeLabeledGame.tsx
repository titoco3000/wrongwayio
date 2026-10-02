import BallDirectionDisplay from '../components/displays/BallDirectionDisplay'
import DirectionWordInput from '../components/inputs/DirectionWordInput'
import DirectionGame, { type GameProps } from '../components/gameTypes/DirectionGame'

/** Movement reaction: ball swipe, press the button labeled like its direction */
export default function SwipeLabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={BallDirectionDisplay} Input={DirectionWordInput} />
}
