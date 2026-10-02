import DirectionDisplay from '../components/DirectionDisplay'
import DirectionWordInput from '../components/DirectionWordInput'
import DirectionGame, { type GameProps } from './DirectionGame'

/** Image reaction: arrow, press the button labeled like its direction */
export default function ArrowLabeledGame(props: GameProps) {
  return <DirectionGame {...props} Display={DirectionDisplay} Input={DirectionWordInput} />
}
