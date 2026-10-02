import SpeechBubbleDisplay from '../components/displays/SpeechBubbleDisplay'
import DirectionSwipeInput from '../components/inputs/DirectionSwipeInput'
import WordGame from '../components/gameTypes/WordGame'
import type { GameProps } from '../components/GameRound'

/** Word reaction: a speech bubble says a direction, swipe that way */
export default function WordSwipeGame(props: GameProps) {
  return <WordGame {...props} Display={SpeechBubbleDisplay} Input={DirectionSwipeInput} />
}
