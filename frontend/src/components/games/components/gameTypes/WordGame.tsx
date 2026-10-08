import GameRound, { type DisplayComponent, type GameProps, type InputComponent } from '../GameRound'

type Props = GameProps & {
  /** overrides the input's time limit */
  timeoutSeconds?: number
  /** writes or speaks a direction */
  Display: DisplayComponent
  /** the user acts out the direction, e.g. by pressing an arrow */
  Input: InputComponent
}

/** The opposite of DirectionGame: the user is told a direction in words and has to do it. */
export default function WordGame(props: Props) {
  return <GameRound {...props} />
}
