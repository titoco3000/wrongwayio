import { useEffect, useRef, useState } from 'react'
import type { Direction } from '../displays/DirectionDisplay'
import type { Point } from '../../hooks/useClickOrigin'
import InputFallback from './InputFallback'
import { matchDirection } from './speechMatch'
import { getNative } from '../../../../native'
import { useI18n } from '../../../../i18n'

/** How much bigger than the button the halo gets at full volume (0.8 = 80%) */
const HALO_GROWTH = 0.8

type Status = 'loading' | 'listening' | 'denied'

type Props = {
  /** called with the direction the user said and the center of the microphone */
  onSubmit: (direction: Direction, origin: Point) => void
  disabled?: boolean
  onPause?: (paused: boolean) => void
}

/**
 * Listens through the microphone, offline and only for the two direction words of the active language:
 * saying "left" or "right" submits it. Falls back to the arrow buttons when the microphone or the
 * recognizer can't start (e.g. permission denied).
 */
export default function DirectionSpeechInput({ onSubmit, disabled, onPause }: Props) {
  const { t, language } = useI18n()
  const [status, setStatus] = useState<Status>('loading')
  // bumped to start over, e.g. when the user asks for microphone access again
  const [attempt, setAttempt] = useState(0)
  const micRef = useRef<HTMLDivElement>(null)
  // moved straight on the element, not through React state: it changes ten times a second
  const haloRef = useRef<HTMLSpanElement>(null)
  const onSubmitRef = useRef(onSubmit)
  onSubmitRef.current = onSubmit
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  // the clock waits while the microphone is being requested and the model loads
  const onPauseRef = useRef(onPause)
  onPauseRef.current = onPause
  useEffect(() => {
    onPauseRef.current?.(status === 'loading')
  }, [status])
  useEffect(() => () => onPauseRef.current?.(false), [])

  useEffect(() => {
    const speech = getNative().speech
    // the word itself plus the ones it is often mistaken for (comma separated in the translations)
    const words: Record<Direction, string[]> = {
      left: [t('direction.left'), ...t('speech.aliases.left').split(',')].filter(Boolean),
      right: [t('direction.right'), ...t('speech.aliases.right').split(',')].filter(Boolean),
    }
    let cancelled = false
    let submitted = false
    speech
      .start(
        ({ text }) => {
          console.log('speech heard:', JSON.stringify(text))
          if (submitted || disabledRef.current) return
          const direction = matchDirection(text, words)
          if (!direction) return
          submitted = true
          const r = micRef.current!.getBoundingClientRect()
          onSubmitRef.current(direction, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
        },
        {
          language: language.split('-')[0],
          grammar: [...words.left, ...words.right],
          onLevel: (level) => haloRef.current?.style.setProperty('transform', `scale(${1 + level * HALO_GROWTH})`),
        },
      )
      .then(
        () => !cancelled && setStatus('listening'),
        () => !cancelled && setStatus('denied'),
      )
    return () => {
      cancelled = true
      void speech.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  if (status === 'denied') {
    return (
      <InputFallback
        onSubmit={onSubmit}
        disabled={disabled}
        allowLabel={t('speech.allow')}
        onAllow={() => {
          setStatus('loading')
          setAttempt((a) => a + 1)
        }}
      />
    )
  }

  return (
    <div className="pop-up flex h-full flex-col items-center justify-center gap-10 p-4">
      <div ref={micRef} className="relative">
        {/* grows with the loudness of the microphone, so it shows that it hears */}
        {status === 'listening' && <span ref={haloRef} aria-hidden className="absolute inset-0 rounded-full bg-brand-blue opacity-40 transition-transform duration-100" />}
        <div className="relative flex size-24 items-center justify-center rounded-full border-2 border-b-4 border-brand-blue-dark bg-brand-blue">
          <svg viewBox="0 0 24 24" aria-hidden className="size-12 fill-none stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
          </svg>
        </div>
      </div>
      <p className="text-center text-xl text-gray-dark">{status === 'loading' ? t('speech.loading') : t('speech.hint', { left: t('direction.left'), right: t('direction.right') })}</p>
    </div>
  )
}

/** Tailwind height class reserved for this input in the game footer: room for the microphone, or for the fallback buttons. */
DirectionSpeechInput.footerHeight = 'h-64'

DirectionSpeechInput.timeoutSeconds = 15
