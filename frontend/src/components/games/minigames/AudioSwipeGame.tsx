import AudioDisplay from '../components/displays/AudioDisplay'
import DirectionSwipeInput from '../components/inputs/DirectionSwipeInput'
import WordGame from '../components/gameTypes/WordGame'
import type { GameProps } from '../components/GameRound'
import { AUDIO_TIMEOUT_SECONDS } from '../components/displays/AudioDisplay'

/** Listening: a voice says a direction, swipe that way */
export default function AudioSwipeGame(props: GameProps) {
  return <WordGame {...props} Display={AudioDisplay} timeoutSeconds={AUDIO_TIMEOUT_SECONDS} Input={DirectionSwipeInput} />
}
