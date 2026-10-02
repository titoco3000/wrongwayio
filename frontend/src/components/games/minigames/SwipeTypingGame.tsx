import BallDirectionDisplay from '../components/displays/BallDirectionDisplay'
import DirectionTypingInput from '../components/inputs/DirectionTypingInput'
import DirectionGame from '../components/gameTypes/DirectionGame'
import type { GameProps } from '../components/GameRound'

/** Movement reaction: ball swipe, type the word of its direction */
export default function SwipeTypingGame(props: GameProps) {
  return <DirectionGame {...props} Display={BallDirectionDisplay} Input={DirectionTypingInput} />
}
