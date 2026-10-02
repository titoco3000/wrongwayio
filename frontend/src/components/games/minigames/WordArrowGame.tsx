import SpeechBubbleDisplay from '../components/displays/SpeechBubbleDisplay'
import DirectionArrowInput from '../components/inputs/DirectionArrowInput'
import WordGame from '../components/gameTypes/WordGame'
import type { GameProps } from '../components/GameRound'

/** Word reaction: a speech bubble says a direction, press the arrow pointing that way */
export default function WordArrowGame(props: GameProps) {
  return <WordGame {...props} Display={SpeechBubbleDisplay} Input={DirectionArrowInput} />
}
