import DirectionDisplay from '../components/displays/DirectionDisplay'
import DirectionWordInput from '../components/inputs/DirectionWordInput'
import DirectionGame from '../components/gameTypes/DirectionGame'
import type { GameProps } from '../components/GameRound'

/** Image reaction: arrow, press the button labeled like its direction */
export default function ArrowLabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={DirectionDisplay} Input={DirectionWordInput} />
}
