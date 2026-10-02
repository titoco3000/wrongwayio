import BallDirectionDisplay from '../components/BallDirectionDisplay'
import DirectionWordInput from '../components/DirectionWordInput'
import DirectionGame, { type GameProps } from './DirectionGame'

/** Movement reaction: ball swipe, press the button labeled like its direction */
export default function SwipeLabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={BallDirectionDisplay} Input={DirectionWordInput} />
}
