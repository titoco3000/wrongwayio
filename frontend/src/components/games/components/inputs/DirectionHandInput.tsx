import { useEffect, useRef, useState } from 'react'
import type { Direction } from '../displays/DirectionDisplay'
import type { Point } from '../../hooks/useClickOrigin'
import { Button } from '../../../general/ButtonsRow'
import DirectionArrowInput from './DirectionArrowInput'
import { acquireHandSession, HAND_BONES, palmSide, type Hand } from './handTracking'
import { useI18n } from '../../../../i18n'

/** How long a palm must stay up on one side to count, so a hand passing by doesn't answer. */
const HOLD_MS = 400
const MIN_PALM_SCORE = 0.6
const BONE_COLOR = '#3b82f6' // brand-blue
const PALM_COLOR = '#22c55e'

type Status = 'loading' | 'ready' | 'denied'

type Props = {
  /** called with the side of the raised palm and the center of the preview */
  onSubmit: (direction: Direction, origin: Point) => void
  disabled?: boolean
  onPause?: (paused: boolean) => void
}

/**
 * Mirrored camera preview with the hand skeleton drawn on top. Holding an open palm up on the left or right
 * half of the preview submits that side (the preview is a mirror, so it is the hand's own side).
 * Falls back to the arrow buttons when the camera or model can't start (e.g. permission denied).
 */
export default function DirectionHandInput({ onSubmit, disabled, onPause }: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<Status>('loading')
  // bumped to start over, e.g. when the user asks for camera access again
  const [attempt, setAttempt] = useState(0)
  const onSubmitRef = useRef(onSubmit)
  onSubmitRef.current = onSubmit
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  // the clock waits while the camera is being requested and the model loads
  const onPauseRef = useRef(onPause)
  onPauseRef.current = onPause
  useEffect(() => {
    onPauseRef.current?.(status === 'loading')
  }, [status])
  useEffect(() => () => onPauseRef.current?.(false), [])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const { ready, release } = acquireHandSession()
    let cancelled = false
    let frame = 0
    let submitted = false
    let held: { side: Direction; since: number } | null = null
    let lastVideoTime = -1
    let hands: { points: { x: number; y: number }[]; palm: boolean }[] = []

    ready.then(
      ({ video, recognizer }) => {
        if (cancelled) return
        setStatus('ready')

        const loop = () => {
          frame = requestAnimationFrame(loop)
          const dpr = window.devicePixelRatio || 1
          const w = canvas.clientWidth
          const h = canvas.clientHeight
          if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
          }
          const vw = video.videoWidth
          const vh = video.videoHeight
          if (!vw || !vh) return

          // video "cover" fit inside the canvas: everything below is in this space
          const scale = Math.max(w / vw, h / vh)
          const dw = vw * scale
          const dh = vh * scale
          const ox = (w - dw) / 2
          const oy = (h - dh) / 2

          const now = performance.now()
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime
            const result = recognizer.recognizeForVideo(video, now)
            hands = result.landmarks.map((points, i) => {
              const gesture = result.gestures[i]?.[0]
              return { points, palm: gesture?.categoryName === 'Open_Palm' && gesture.score >= MIN_PALM_SCORE }
            })
          }

          // mirrored: draw in the raw frame's space, flipped horizontally
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.clearRect(0, 0, w, h)
          ctx.save()
          ctx.translate(w, 0)
          ctx.scale(-1, 1)
          ctx.drawImage(video, ox, oy, dw, dh)
          ctx.lineCap = 'round'
          for (const hand of hands) {
            const color = hand.palm ? PALM_COLOR : BONE_COLOR
            const at = (i: number) => ({ x: ox + hand.points[i].x * dw, y: oy + hand.points[i].y * dh })
            ctx.strokeStyle = color
            ctx.lineWidth = 4
            ctx.beginPath()
            for (const [from, to] of HAND_BONES) {
              const a = at(from)
              const b = at(to)
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
            }
            ctx.stroke()
            ctx.fillStyle = color
            for (let i = 0; i < hand.points.length; i++) {
              const p = at(i)
              ctx.beginPath()
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          ctx.restore()

          if (submitted || disabledRef.current) return
          const side = palmSide(
            hands.map((hand): Hand => ({ palm: hand.palm, x: (w - (ox + hand.points[0].x * dw)) / w })),
          )
          if (side === null) held = null
          else if (held?.side !== side) held = { side, since: now }
          else if (now - held.since >= HOLD_MS) {
            submitted = true
            const r = canvas.getBoundingClientRect()
            onSubmitRef.current(side, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
          }
        }
        loop()
      },
      () => {
        if (!cancelled) setStatus('denied')
      },
    )

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      release()
    }
  }, [attempt])

  // no camera: answer with the arrow buttons instead, at the bottom of the tall footer
  if (status === 'denied') {
    return (
      <div className="flex h-full flex-col justify-end">
        <div className="px-4">
          <Button
            variant="primary"
            disabled={disabled}
            className="w-full"
            onClick={() => {
              setStatus('loading')
              setAttempt((a) => a + 1)
            }}
          >
            {t('hand.allow')}
          </Button>
        </div>
        <DirectionArrowInput onSubmit={onSubmit} disabled={disabled} />
      </div>
    )
  }

  return (
    <div className="pop-up h-full p-4">
      <div className="relative h-full overflow-hidden rounded-2xl bg-gray-dark">
        <canvas ref={canvasRef} className="size-full" />
        <p className="absolute inset-x-0 top-0 bg-linear-to-b from-black/70 to-transparent px-4 pt-3 pb-6 text-center text-xl font-bold text-white">
          {status === 'loading' ? t('hand.loading') : t('hand.hint')}
        </p>
      </div>
    </div>
  )
}

/** Tailwind height class reserved for this input in the game footer: most of the screen, so the preview is large. */
DirectionHandInput.footerHeight = 'h-[60dvh]'

DirectionHandInput.timeoutSeconds = 5
