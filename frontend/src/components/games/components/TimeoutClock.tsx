import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button } from '../../general/ButtonsRow'

/** the shaking starts once this fraction of the time has passed, and grows until the end */
const SHAKE_FROM = 0.5
const JUMP_MS = 600
const JUMP_SCALE = 4
const ALARM_URL = `${import.meta.env.BASE_URL}sounds/clock-alarm.mp3`

type Props = {
  /** seconds for the hand to do a full turn */
  seconds: number
  /** the hand moves only while true; pausing keeps its position */
  running: boolean
  /** called once, when the hand is back at 12 */
  onTimeUp: () => void
  /** called when the user continues from the "Time's up!" screen */
  onContinue: () => void
}

type FaceProps = { handRef?: React.Ref<SVGLineElement>; svgRef?: React.Ref<SVGSVGElement>; style?: CSSProperties; className?: string }

function ClockFace({ handRef, svgRef, style, className = '' }: FaceProps) {
  return (
    <svg ref={svgRef} viewBox="0 0 24 24" aria-hidden className={`size-10 overflow-visible ${className}`} style={style}>
      {/* button on top, behind the face */}
      <rect x="9.5" y="-1.5" width="5" height="4" rx="1" className="fill-ink" />
      <circle cx="12" cy="12" r="10" strokeWidth="2.5" className="fill-paper stroke-ink" />
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="5"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-brand-red"
        style={{ transformOrigin: '12px 12px' }}
        />
      <line
        ref={handRef}
        x1="12"
        y1="12"
        x2="12"
        y2="5"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="stroke-ink"
        style={{ transformOrigin: '12px 12px' }}
      />
      <circle cx="12" cy="12" r="1.5" className="fill-ink" />
    </svg>
  )
}

/**
 * Alarm clock that starts at 12 and does a full turn in `seconds`. It shakes more and more
 * as time runs out. When the turn is complete it jumps to the middle of the screen, labeled "Time's up!".
 * Remount (change `key`) to start over.
 */
export default function TimeoutClock({ seconds, running, onTimeUp, onContinue }: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const faceRef = useRef<SVGSVGElement>(null)
  const handRef = useRef<SVGLineElement>(null)
  const elapsed = useRef(0) // ms the clock has been running
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp
  const spotRef = useRef<HTMLDivElement>(null)
  const alarmRef = useRef<HTMLAudioElement>(null)
  // center of the clock in the header when time ran out: where the jump starts
  const [ended, setEnded] = useState<{ x: number; y: number } | null>(null)
  // center of the clock's place on the "Time's up!" screen; set when the jump starts
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null)

  // preloaded so it rings the moment time runs out; stopped if the clock goes away while it rings
  useEffect(() => {
    const alarm = new Audio(ALARM_URL)
    alarm.preload = 'auto'
    alarmRef.current = alarm
    return () => {
      alarm.pause()
      alarmRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!running || ended) return
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      elapsed.current += now - last
      last = now
      const t = Math.min(1, elapsed.current / (seconds * 1000))
      if (handRef.current) handRef.current.style.transform = `rotate(${t * 360}deg)`
      if (faceRef.current) {
        const s = Math.max(0, (t - SHAKE_FROM) / (1 - SHAKE_FROM))
        faceRef.current.style.transform =
          s > 0 ? `translateX(${Math.sin(now * 0.06 * (1 + s)) * (0.5 + s * 2.5)}px) rotate(${Math.sin(now * 0.07 * (1 + s)) * s * 8}deg)` : ''
      }
      if (t >= 1) {
        const r = slotRef.current!.getBoundingClientRect()
        setEnded({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        alarmRef.current?.play().catch(() => {})
        onTimeUpRef.current()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, seconds, ended])

  // wait for the clock to paint at the start spot, so the move to the middle is animated
  useEffect(() => {
    if (!ended) return
    let inner = 0
    const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => {
          const r = spotRef.current!.getBoundingClientRect()
          setTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        })))
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [ended])

  return (
    <>
      <div ref={slotRef} className="size-10 shrink-0">
        {!ended && <ClockFace svgRef={faceRef} handRef={handRef} />}
      </div>
      {ended && (
        <>
          {/* same layout as the lose screen: title, picture, button */}
          <div
            className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-paper p-6 text-center text-ink transition-opacity duration-300"
            style={{ opacity: target ? 1 : 0 }}
          >
            <h1 style={{ animationDelay: `${JUMP_MS * 0.6}ms` }} className="fade-in text-5xl text-brand-red">
              Time&apos;s up!
            </h1>
            <div ref={spotRef} className="size-40" />
            <div style={{ animationDelay: `${JUMP_MS * 0.6}ms` }} className="fade-in w-full max-w-xl">
              <Button className="w-full" onClick={onContinue}>
                Continue
              </Button>
            </div>
          </div>
          {/* outside the screen above, so its fade doesn't affect the clock's fixed position */}
          <div
            className="pointer-events-none fixed z-10"
            style={{
              left: target?.x ?? ended.x,
              top: target?.y ?? ended.y,
              transform: `translate(-50%, -50%) scale(${target ? JUMP_SCALE : 1})`,
              transition: `left ${JUMP_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1), top ${JUMP_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1), transform ${JUMP_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
            }}
          >
            <ClockFace className="clock-alarm-shake" handRef={(el) => void (el && (el.style.transform = 'rotate(360deg)'))} />
          </div>
        </>
      )}
    </>
  )
}
