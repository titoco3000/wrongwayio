import { useState } from 'react'
import SpeechBubble from '../SpeechBubble'
import type { Direction } from './DirectionDisplay'
import { useI18n } from '../../../../i18n'

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
  const { t } = useI18n()
  const [side] = useState<Direction>(() => (Math.random() < 0.5 ? 'left' : 'right'))
  return (
    <div className="w-full overflow-x-clip">
      <div className={`bubble-from-${side} px-1`} onAnimationEnd={() => onDirectionSet(direction)}>
        <SpeechBubble side={side}>
          <span className="text-4xl">{t(`direction.${direction}`)}</span>
        </SpeechBubble>
      </div>
    </div>
  )
}
