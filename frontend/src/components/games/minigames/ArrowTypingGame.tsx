import DirectionDisplay from '../components/displays/DirectionDisplay'
import DirectionTypingInput from '../components/inputs/DirectionTypingInput'
import DirectionGame, { type GameProps } from '../components/gameTypes/DirectionGame'

/** Image reaction: arrow, type the word of its direction */
export default function ArrowTypingGame(props: GameProps) {
  return <DirectionGame {...props} Display={DirectionDisplay} Input={DirectionTypingInput} />
}
