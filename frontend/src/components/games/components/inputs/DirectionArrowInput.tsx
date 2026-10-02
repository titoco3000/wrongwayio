import { Button, ButtonsRow } from '../../../general/ButtonsRow'
import type { Direction } from '../displays/DirectionDisplay'
import { useClickOrigin, type Point } from '../../hooks/useClickOrigin'

type Props = {
  /** called with the direction the user picked and the center of the pressed button */
  onSubmit: (direction: Direction, origin: Point) => void
  disabled?: boolean
}

const ARROWS: Record<Direction, string> = { left: '←', right: '→' }

/** Two buttons side by side, each with an arrow: the left one points left, the right one right. Pops up from the bottom on mount. */
export default function DirectionArrowInput({ onSubmit, disabled }: Props) {
  const { origin, onClick } = useClickOrigin()
  return (
    <div className="pop-up p-4">
      <ButtonsRow onSubmit={(v) => onSubmit(v as Direction, origin.current)}>
        {(['left', 'right'] as const).map((d) => (
          <Button key={d} value={d} variant="neutral" disabled={disabled} aria-label={d} className="py-8! text-5xl" onClick={onClick}>
            {ARROWS[d]}
          </Button>
        ))}
      </ButtonsRow>
    </div>
  )
}

DirectionArrowInput.timeoutSeconds = 4
