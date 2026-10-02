import BallDirectionDisplay from '../components/displays/BallDirectionDisplay'
import DirectionTypingInput from '../components/inputs/DirectionTypingInput'
import DirectionGame, { type GameProps } from '../components/gameTypes/DirectionGame'

/** Movement reaction: ball swipe, type the word of its direction */
export default function SwipeTypingGame(props: GameProps) {
  return <DirectionGame {...props} Display={BallDirectionDisplay} Input={DirectionTypingInput} />
}
