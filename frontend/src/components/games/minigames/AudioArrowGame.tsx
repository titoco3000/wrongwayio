import AudioDisplay from '../components/displays/AudioDisplay'
import DirectionArrowInput from '../components/inputs/DirectionArrowInput'
import WordGame from '../components/gameTypes/WordGame'
import type { GameProps } from '../components/GameRound'
import { AUDIO_TIMEOUT_SECONDS } from '../components/displays/AudioDisplay'

/** Listening: a voice says a direction, press the arrow pointing that way */
export default function AudioArrowGame(props: GameProps) {
  return <WordGame {...props} Display={AudioDisplay} timeoutSeconds={AUDIO_TIMEOUT_SECONDS} Input={DirectionArrowInput} />
}
