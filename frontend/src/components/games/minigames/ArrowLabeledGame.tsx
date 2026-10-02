import DirectionDisplay from '../components/displays/DirectionDisplay'
import DirectionWordInput from '../components/inputs/DirectionWordInput'
import DirectionGame, { type GameProps } from '../components/gameTypes/DirectionGame'

/** Image reaction: arrow, press the button labeled like its direction */
export default function ArrowLabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={DirectionDisplay} Input={DirectionWordInput} />
}
