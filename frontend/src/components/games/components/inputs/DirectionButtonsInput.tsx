import { Button, ButtonsRow } from '../../../general/ButtonsRow'
import type { Direction } from '../displays/DirectionDisplay'
import { useClickOrigin, type Point } from '../../hooks/useClickOrigin'

type Props = {
  /** called with the direction the user picked and the center of the pressed button */
  onSubmit: (direction: Direction, origin: Point) => void
}

/** Two identical, unlabeled buttons side by side: the left one means left, the right one right. Pops up from the bottom on mount. */
export default function DirectionButtonsInput({ onSubmit }: Props) {
  const { origin, onClick } = useClickOrigin()
  return (
    <div className="pop-up p-4">
      <ButtonsRow onSubmit={(v) => onSubmit(v as Direction, origin.current)}>
        {(['left', 'right'] as const).map((d) => (
          <Button key={d} value={d} variant="neutral" aria-label={d} className="py-12!" onClick={onClick} />
        ))}
      </ButtonsRow>
    </div>
  )
}
