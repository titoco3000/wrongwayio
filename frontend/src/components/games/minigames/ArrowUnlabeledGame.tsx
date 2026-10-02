import DirectionDisplay from '../components/displays/DirectionDisplay'
import DirectionButtonsInput from '../components/inputs/DirectionButtonsInput'
import DirectionGame, { type GameProps } from '../components/gameTypes/DirectionGame'

/** Image reaction: arrow, press the unlabeled button on its side */
export default function ArrowUnlabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={DirectionDisplay} Input={DirectionButtonsInput} />
}
