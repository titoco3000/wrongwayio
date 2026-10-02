import DirectionDisplay from '../components/DirectionDisplay'
import DirectionButtonsInput from '../components/DirectionButtonsInput'
import DirectionGame, { type GameProps } from './DirectionGame'

/** Image reaction: arrow, press the unlabeled button on its side */
export default function ArrowUnlabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={DirectionDisplay} Input={DirectionButtonsInput} />
}
