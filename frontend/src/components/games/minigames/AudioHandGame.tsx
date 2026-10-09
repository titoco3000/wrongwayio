import AudioDisplay from '../components/displays/AudioDisplay'
import DirectionHandInput from '../components/inputs/DirectionHandInput'
import WordGame from '../components/gameTypes/WordGame'
import type { GameProps } from '../components/GameRound'
import { AUDIO_TIMEOUT_SECONDS } from '../components/displays/AudioDisplay'

/** Listening: a voice says a direction, raise your open palm on that side to the camera */
export default function AudioHandGame(props: GameProps) {
  return <WordGame {...props} Display={AudioDisplay} timeoutSeconds={AUDIO_TIMEOUT_SECONDS} Input={DirectionHandInput} />
}
