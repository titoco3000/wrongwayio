import GameRound, { type DisplayComponent, type GameProps, type InputComponent } from '../GameRound'

type Props = GameProps & {
  /** acts out a direction (arrow, ball swipe, ...) */
  Display: DisplayComponent
  /** the user names the direction, e.g. by pressing a labeled button or typing it */
  Input: InputComponent
}

/** The user sees a direction and has to name it. */
export default function DirectionGame(props: Props) {
  return <GameRound {...props} />
}
