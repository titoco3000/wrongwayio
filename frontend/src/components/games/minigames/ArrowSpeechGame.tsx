import DirectionDisplay from '../components/displays/DirectionDisplay'
import DirectionSpeechInput from '../components/inputs/DirectionSpeechInput'
import DirectionGame from '../components/gameTypes/DirectionGame'
import type { GameProps } from '../components/GameRound'

/** Image reaction: arrow, say its direction out loud */
export default function ArrowSpeechGame(props: GameProps) {
  return <DirectionGame {...props} Display={DirectionDisplay} Input={DirectionSpeechInput} />
}
