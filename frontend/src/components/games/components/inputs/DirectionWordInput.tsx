import { useState } from 'react'
import { Button, ButtonsRow } from './ButtonsRow'
import type { Direction } from './DirectionDisplay'
import { useClickOrigin, type Point } from './useClickOrigin'

const flip = () => Math.random() < 0.5

/** Random button order, and one blue and one red button, assigned independently of the order. */
const randomButtons = (): { direction: Direction; variant: 'primary' | 'danger' }[] => {
  const order: Direction[] = flip() ? ['left', 'right'] : ['right', 'left']
  const leftIsBlue = flip()
  return order.map((direction) => ({
    direction,
    variant: (direction === 'left') === leftIsBlue ? 'primary' : 'danger',
  }))
}

type Props = {
  /** called with the direction the user picked and the center of the pressed button */
  onSubmit: (direction: Direction, origin: Point) => void
}

/** Large buttons labeled "left"/"right" in random order and random red/blue colors. Pops up from the bottom on mount. */
export default function DirectionWordInput({ onSubmit }: Props) {
  const [order] = useState(randomButtons)
  const { origin, onClick } = useClickOrigin()
  return (
    <div className="pop-up p-4">
      <ButtonsRow onSubmit={(v) => onSubmit(v as Direction, origin.current)}>
        {order.map(({ direction, variant }) => (
          <Button key={direction} value={direction} variant={variant} className="py-8! text-3xl" onClick={onClick}>
            {direction}
          </Button>
        ))}
      </ButtonsRow>
    </div>
  )
}
