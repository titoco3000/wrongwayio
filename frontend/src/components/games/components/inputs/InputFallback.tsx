import type { Direction } from '../displays/DirectionDisplay'
import type { Point } from '../../hooks/useClickOrigin'
import { Button } from '../../../general/ButtonsRow'
import DirectionArrowInput from './DirectionArrowInput'

type Props = {
  onSubmit: (direction: Direction, origin: Point) => void
  disabled?: boolean
  /** text of the button that asks for the permission again */
  allowLabel: string
  onAllow: () => void
}

/** For inputs that need a permission the user didn't give: a button to ask again, and the arrow buttons to play meanwhile. At the bottom of a tall footer. */
export default function InputFallback({ onSubmit, disabled, allowLabel, onAllow }: Props) {
  return (
    <div className="flex h-full flex-col justify-end">
      <div className="px-4">
        <Button variant="primary" disabled={disabled} className="w-full" onClick={onAllow}>
          {allowLabel}
        </Button>
      </div>
      <DirectionArrowInput onSubmit={onSubmit} disabled={disabled} />
    </div>
  )
}
