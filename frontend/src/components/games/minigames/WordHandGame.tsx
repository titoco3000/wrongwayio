import SpeechBubbleDisplay from '../components/displays/SpeechBubbleDisplay'
import DirectionHandInput from '../components/inputs/DirectionHandInput'
import WordGame from '../components/gameTypes/WordGame'
import type { GameProps } from '../components/GameRound'

/** Word reaction: a speech bubble says a direction, raise your open palm on that side to the camera */
export default function WordHandGame(props: GameProps) {
  return <WordGame {...props} Display={SpeechBubbleDisplay} Input={DirectionHandInput} />
}
