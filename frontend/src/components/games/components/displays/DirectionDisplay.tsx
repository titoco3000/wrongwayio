import type { CSSProperties } from 'react'
import { useI18n } from '../../../../i18n'

export type Direction = 'left' | 'right'

/** Two full turns, then rest at the target angle (→ is 0deg, ← is 180deg). */
const endAngle = (direction: Direction) => (direction === 'right' ? 720 : 900)

type Props = {
  direction: Direction
  /** called once the arrow stopped spinning and shows `direction` */
  onDirectionSet: (direction: Direction) => void
}

/**
 * Big arrow showing the direction the user is supposed to press.
 * Spins on mount before settling; remount (change `key`) to spin again.
 */
export default function DirectionDisplay({ direction, onDirectionSet }: Props) {
  const { t } = useI18n()
  return (
    <div
      role="img"
      aria-label={t(`direction.arrow.${direction}`)}
      className="flex size-40 items-center justify-center rounded-3xl border-4 border-ink text-8xl shadow-[4px_4px_0_0_var(--color-ink)]"
    >
      <span
        className="arrow-spin block"
        style={{ '--arrow-end': `${endAngle(direction)}deg` } as CSSProperties}
        onAnimationEnd={() => onDirectionSet(direction)}
      >
        →
      </span>
    </div>
  )
}
