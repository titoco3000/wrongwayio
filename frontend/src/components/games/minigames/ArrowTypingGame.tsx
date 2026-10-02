import DirectionDisplay from '../components/displays/DirectionDisplay'
import DirectionTypingInput from '../components/inputs/DirectionTypingInput'
import DirectionGame from '../components/gameTypes/DirectionGame'
import type { GameProps } from '../components/GameRound'

/** Image reaction: arrow, type the word of its direction */
export default function ArrowTypingGame(props: GameProps) {
  return <DirectionGame {...props} Display={DirectionDisplay} Input={DirectionTypingInput} />
}
