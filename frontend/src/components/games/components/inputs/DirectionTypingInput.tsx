import { useState } from 'react'
import { Button } from '../../../general/ButtonsRow'
import type { Direction } from '../displays/DirectionDisplay'
import { useClickOrigin, type Point } from '../../hooks/useClickOrigin'
import { useKeySound } from '../../hooks/useKeySound'

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

export type DirectionWords = Record<Direction, string[]>

const ENGLISH: DirectionWords = { left: ['left'], right: ['right'] }

type Props = {
  /** called with the direction whose word was typed and the center of the last pressed key */
  onSubmit: (direction: Direction, origin: Point) => void
  /** accepted words per direction (lowercase). No word may be a prefix of another. */
  words?: DirectionWords
}

/** QWERTY keyboard under a text field. Only letters that continue an allowed word are enabled; submits on completing one. */
/** Tailwind height class reserved for this input in the game footer. */
const footerHeight = 'h-72'

export default function DirectionTypingInput({ onSubmit, words = ENGLISH }: Props) {
  const [typed, setTyped] = useState('')
  const { origin, onClick } = useClickOrigin()
  const playKey = useKeySound()

  const entries = (Object.keys(words) as Direction[]).flatMap((d) => words[d].map((word) => ({ direction: d, word })))
  const enabled = new Set(entries.filter((e) => e.word.startsWith(typed)).map((e) => e.word[typed.length]))

  const type = (letter: string) => {
    const next = typed + letter
    const match = entries.find((e) => e.word === next)
    if (match) onSubmit(match.direction, origin.current)
    else setTyped(next)
  }

  return (
    <div className="pop-up flex flex-col gap-3 p-2">
      <div
        aria-live="polite"
        className="flex h-16 items-center justify-center rounded-2xl  bg-paper text-3xl uppercase tracking-widest text-ink"
      >
        {typed}
      </div>
      <div className="flex flex-col gap-2">
        {ROWS.map((row, i) => (
          <div key={row} className={`grid grid-cols-20 gap-1`}>
            {[...row].map((letter, j) => (
              <Button
                key={letter}
                variant="neutral"
                disabled={!enabled.has(letter)}
                className={`col-span-2 min-w-0! px-0! py-2! disabled:opacity-20! text-xl ${i > 0 && j === 0 ? 'col-start-2' : ''}`}
                onClick={(e) => {
                  onClick(e)
                  playKey()
                  type(letter)
                }}
              >
                {letter}
              </Button>
            ))}
            {i === ROWS.length - 1 && (
              <Button
                variant="neutral"
                aria-label="Backspace"
                disabled={!typed}
                className="col-span-4 min-w-0! px-0! py-2! disabled:opacity-20! text-xl"
                onClick={() => setTyped(typed.slice(0, -1))}
              >
                ⌫
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

DirectionTypingInput.footerHeight = footerHeight
