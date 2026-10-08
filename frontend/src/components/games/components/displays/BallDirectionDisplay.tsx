import { useEffect, useRef, useState } from 'react'
import type { Direction } from './DirectionDisplay'
import { useI18n } from '../../../../i18n'

type Props = {
  direction: Direction
  /** called once the ball and path are gone and the question was shown */
  onDirectionSet: (direction: Direction) => void
}

// horizontal travel, kept inside narrow screens
const TRAVEL = 'min(35vw, 140px)'

// timeline, ms
const START_DELAY_MS = 500 // ball appears, then waits
const MOVE_MS = 700
const FADE_MS = 600 // how long each piece of the path lives after the ball drew it
// pauses after the ball is gone
const QUESTION_DELAY_MS = 400
const INPUT_DELAY_MS = 400

const STEPS = 48 // resolution of the path's fade gradient
const TRAIL_RGB = '59, 130, 246' // brand-blue

const easeInOut = (s: number) => (s < 0.5 ? 4 * s ** 3 : 1 - (-2 * s + 2) ** 3 / 2)

/** time (relative to the start of the move, ms) at which the eased ball position reaches fraction `x` */
const timeAt = (x: number) => {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (easeInOut(mid) < x) lo = mid
    else hi = mid
  }
  return hi * MOVE_MS
}

// drawn-at time of every gradient stop; depends only on the easing
const DRAWN_AT = Array.from({ length: STEPS + 1 }, (_, i) => timeAt(i / STEPS))

/**
 * A ball starts at the center and swipes left or right, leaving a path. Every piece of the
 * path starts fading as soon as the ball has drawn it, so the fade chases the ball and
 * the path vanishes. Afterwards the ball fades and asks which way it went.
 * Remount (change `key`) to play again.
 */
export default function BallDirectionDisplay({ direction, onDirectionSet }: Props) {
  const { t } = useI18n()
  const sign = direction === 'right' ? 1 : -1
  const ballRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const [pathGone, setPathGone] = useState(false)
  const [gone, setGone] = useState(false)
  const [done, setDone] = useState(false)

  // drive ball and path from the same clock so the fade stays in step with the ball
  useEffect(() => {
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = now - start - START_DELAY_MS // ms since the move began
      const progress = easeInOut(Math.min(1, Math.max(0, t / MOVE_MS)))
      if (ballRef.current) ballRef.current.style.transform = `translateX(calc(${TRAVEL} * ${progress * sign}))`
      if (trailRef.current) {
        const stops = DRAWN_AT.map((drawn, i) => {
          const alpha = t < drawn ? 0 : Math.max(0, 1 - (t - drawn) / FADE_MS)
          return `rgba(${TRAIL_RGB}, ${alpha.toFixed(3)}) ${((i / STEPS) * 100).toFixed(1)}%`
        })
        trailRef.current.style.backgroundImage = `linear-gradient(to ${direction}, ${stops.join(', ')})`
      }
      if (t >= MOVE_MS + FADE_MS) setPathGone(true)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [direction, sign])

  // path and ball gone -> pause -> question appears -> pause -> input may appear
  useEffect(() => {
    if (!gone) return
    const t = setTimeout(() => setDone(true), QUESTION_DELAY_MS)
    return () => clearTimeout(t)
  }, [gone])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => onDirectionSet(direction), INPUT_DELAY_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  return (
    <div className="relative w-full">
      <div className="relative h-32 w-full">
        <div
          ref={trailRef}
          aria-hidden
          className={`absolute top-1/2 -mt-8 h-16 ${direction === 'right' ? 'left-1/2' : 'right-1/2'}`}
          style={{ width: TRAVEL }}
        />
        <div
          ref={ballRef}
          aria-hidden
          className={`absolute top-1/2 left-1/2 -mt-8 -ml-8 size-16 rounded-full border-4 border-brand-red-dark bg-brand-red ${
            pathGone ? 'ball-fade' : ''
          }`}
          onAnimationEnd={() => setGone(true)}
        />
      </div>
      {/* appears at the center, where the ball started and then faded out */}
      <p className={`absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-2xl ${done ? 'fade-in' : 'invisible'}`}>
        {t('swipe.question')}
      </p>
    </div>
  )
}
