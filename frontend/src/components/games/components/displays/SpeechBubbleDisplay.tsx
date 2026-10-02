import { useState } from 'react'
import SpeechBubble from '../SpeechBubble'
import type { Direction } from './DirectionDisplay'

type Props = {
  direction: Direction
  /** called once the bubble arrived and shows the word */
  onDirectionSet: (direction: Direction) => void
}

/**
 * Speech bubble saying "left" or "right", sliding in from a random side (unrelated to the word).
 * Remount (change `key`) to play again.
 */
export default function SpeechBubbleDisplay({ direction, onDirectionSet }: Props) {
  const [side] = useState<Direction>(() => (Math.random() < 0.5 ? 'left' : 'right'))
  return (
    <div className="w-full overflow-x-clip">
      <div className={`bubble-from-${side}`} onAnimationEnd={() => onDirectionSet(direction)}>
        <SpeechBubble side={side}>
          <span className="text-4xl">{direction}</span>
        </SpeechBubble>
      </div>
    </div>
  )
}
