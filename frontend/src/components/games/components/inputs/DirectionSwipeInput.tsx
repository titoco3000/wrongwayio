import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Direction } from '../displays/DirectionDisplay'
import type { Point } from '../../hooks/useClickOrigin'
import { useI18n } from '../../../../i18n'

const BALL_RADIUS = 32
const GROW_MS = 150
const BALL_FADE_MS = 250
const TRAIL_FADE_MS = 600
/** distance between the balls that make up the trail, px */
const TRAIL_SPACING = 4
const TRAIL_RGB = '59, 130, 246' // brand-blue
const BALL_FILL = '#ef4444' // brand-red
const BALL_BORDER = '#b91c1c' // brand-red-dark
const BORDER_WIDTH = 4

/** Horizontal distance from the press point the release must reach to count as a swipe, same as the ball display's travel. */
const swipeDistance = () => Math.min(window.innerWidth * 0.35, 60)

type Gesture = { start: Point; current: Point; lastTrail: Point; downAt: number; upAt: number | null }
type TrailBall = Point & { at: number }

type Props = {
  /** called with the swipe direction and the point where the pointer was released */
  onSubmit: (direction: Direction, origin: Point) => void
  disabled?: boolean
}

/**
 * Swipe anywhere on the screen (buttons excepted): a red ball grows under the pointer and leaves a fading
 * blue trail. Releasing at least `swipeDistance()` to the left or right of the press point submits that direction;
 * vertical movement doesn't matter and a shorter swipe is ignored.
 */
export default function DirectionSwipeInput({ onSubmit, disabled }: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onSubmitRef = useRef(onSubmit)
  onSubmitRef.current = onSubmit
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let gesture: Gesture | null = null
    let trail: TrailBall[] = []
    let submitted = false

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // fill the gap between the last trail ball and the pointer, so fast moves leave no holes
    const extendTrail = (g: Gesture, now: number) => {
      const dx = g.current.x - g.lastTrail.x
      const dy = g.current.y - g.lastTrail.y
      const steps = Math.floor(Math.hypot(dx, dy) / TRAIL_SPACING)
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        trail.push({ x: g.lastTrail.x + dx * t, y: g.lastTrail.y + dy * t, at: now })
      }
      if (steps > 0) g.lastTrail = { x: g.lastTrail.x + dx, y: g.lastTrail.y + dy }
    }

    const point = (e: PointerEvent): Point => ({ x: e.clientX, y: e.clientY })

    const onDown = (e: PointerEvent) => {
      if (submitted || disabledRef.current || gesture || !e.isPrimary || e.button !== 0) return
      if (e.target instanceof Element && e.target.closest('button, [role="dialog"]')) return
      const p = point(e)
      gesture = { start: p, current: p, lastTrail: p, downAt: performance.now(), upAt: null }
    }
    const onMove = (e: PointerEvent) => {
      if (!gesture || gesture.upAt !== null) return
      gesture.current = point(e)
      extendTrail(gesture, performance.now())
    }
    const onUp = (e: PointerEvent) => {
      if (!gesture || gesture.upAt !== null) return
      gesture.upAt = performance.now()
      const p = point(e)
      const dx = p.x - gesture.start.x
      if (Math.abs(dx) >= swipeDistance()) {
        submitted = true
        onSubmitRef.current(dx > 0 ? 'right' : 'left', p)
      }
    }
    const onCancel = () => {
      if (gesture && gesture.upAt === null) gesture.upAt = performance.now()
    }

    let frame = 0
    const draw = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      trail = trail.filter((b) => now - b.at < TRAIL_FADE_MS)
      // oldest first, so the newest (most opaque) balls end up on top
      for (const b of trail) {
        ctx.fillStyle = `rgba(${TRAIL_RGB}, ${1 - (now - b.at) / TRAIL_FADE_MS})`
        ctx.beginPath()
        ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      if (gesture) {
        const alpha = gesture.upAt === null ? 1 : 1 - (now - gesture.upAt) / BALL_FADE_MS
        if (alpha <= 0) gesture = null
        else {
          const grown = Math.min(1, (now - gesture.downAt) / GROW_MS)
          const radius = BALL_RADIUS * (1 - (1 - grown) ** 3)
          ctx.globalAlpha = alpha
          ctx.beginPath()
          ctx.arc(gesture.current.x, gesture.current.y, Math.max(0, radius - BORDER_WIDTH / 2), 0, Math.PI * 2)
          ctx.fillStyle = BALL_FILL
          ctx.fill()
          ctx.lineWidth = BORDER_WIDTH
          ctx.strokeStyle = BALL_BORDER
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)

    // The browser must not scroll, zoom or select text while swiping: if it starts a pan it fires pointercancel
    // and the swipe dies mid-gesture. `touch-action` on the body alone doesn't reach past the page's scroll
    // container, so the `swiping` class (index.css) sets it on every element; touchmove's preventDefault is the
    // fallback for WebViews that ignore it.
    document.documentElement.classList.add('swiping')
    const blockTouch = (e: TouchEvent) => {
      if (gesture && gesture.upAt === null && e.cancelable) e.preventDefault()
    }

    document.addEventListener('touchmove', blockTouch, { passive: false })
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('resize', resize)
      document.removeEventListener('touchmove', blockTouch)
      document.documentElement.classList.remove('swiping')
    }
  }, [])

  return (
    <>
      <p className="pop-up p-4 text-center text-xl text-gray-dark">{t('swipe.hint')}</p>
      {/* in the body, so no transformed ancestor affects `fixed` */}
      {createPortal(<canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-40 size-full" />, document.body)}
    </>
  )
}

/** Tailwind height class reserved for this input in the game footer. */
DirectionSwipeInput.footerHeight = 'h-24'

DirectionSwipeInput.timeoutSeconds = 4
