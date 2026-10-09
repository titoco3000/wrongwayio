import BallDirectionDisplay from '../components/displays/BallDirectionDisplay'
import DirectionSpeechInput from '../components/inputs/DirectionSpeechInput'
import DirectionGame from '../components/gameTypes/DirectionGame'
import type { GameProps } from '../components/GameRound'

/** Movement reaction: ball swipe, say its direction out loud */
export default function SwipeSpeechGame(props: GameProps) {
  return <DirectionGame {...props} Display={BallDirectionDisplay} Input={DirectionSpeechInput} />
}
