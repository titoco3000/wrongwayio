import { useState } from 'react'
import { type ComponentType } from 'react'
import type { Direction } from './displays/DirectionDisplay'
import MiniGame from './MiniGame'
import type { ChallengeProgress } from './ResultScreen'
import ProgressBar from '../../general/ProgressBar'
import StackPage from '../../general/StackPage'
import StarBurst from './StarBurst'
import TimeoutClock from './TimeoutClock'
import type { Point } from '../hooks/useClickOrigin'

/** Shows the direction, then calls onDirectionSet. Remounted every round. */
export type DisplayComponent = ComponentType<{ direction: Direction; onDirectionSet: (direction: Direction) => void }>
/** Mounted once the direction is set; reports the user's answer and where it was pressed. */
export type InputComponent = ComponentType<{
  onSubmit: (direction: Direction, origin: Point) => void
  /** true once time ran out: the input must stop reacting */
  disabled?: boolean
}> & {
  /** Seconds the user has to answer, or a function giving them (for limits that depend on the language). Default 5. */
  timeoutSeconds?: number | (() => number)
  /** Tailwind height class reserved in the footer, so the display doesn't shift when the input appears. Default h-40. */
  footerHeight?: string
}

export type GameProps = {
  loops: number
  onEnd: (won: boolean) => void
  /** set when the game is one of several in a row: shown on the win screen */
  progress?: ChallengeProgress
}

type Props = GameProps & { Display: DisplayComponent; Input: InputComponent }

/**
 * Round flow shared by every direction game: the display presents a direction, the input answers,
 * and one wrong answer loses. What the display and input mean is up to the game type. Renders a closeable page.
 */
export default function GameRound({ loops, onEnd, progress, Display, Input }: Props) {
  return (
    <MiniGame loops={loops} onEnd={onEnd} progress={progress}>
      {({ direction, index, completed, loops, answer, endLost }) => (
        <RoundPage Display={Display} Input={Input} direction={direction} index={index} completed={completed} loops={loops} answer={answer} endLost={endLost} />
      )}
    </MiniGame>
  )
}

type RoundProps = { Display: DisplayComponent; Input: InputComponent; direction: Direction; index: number; completed: number; loops: number; answer: (value: Direction) => boolean; endLost: () => void }

type Burst = Point & { id: number }

let nextBurst = 0

const DEFAULT_TIMEOUT_SECONDS = 5

function RoundPage({ Display, Input, direction, index, completed, loops, answer, endLost }: RoundProps) {
  // index of the round whose arrow finished spinning; derived so the page (and its progress bar) stays mounted between rounds
  const [setRound, setSetRound] = useState(-1)
  const directionSet = setRound === index
  // lives here (not in the input) so stars keep flying after the next round replaces the input
  const [bursts, setBursts] = useState<Burst[]>([])

  const [timedUp, setTimedUp] = useState(false)
  const submit = (value: Direction, origin: Point) => {
    if (timedUp) return
    if (answer(value)) setBursts((b) => [...b, { ...origin, id: nextBurst++ }])
  }

  return (
    <>
      <StackPage
        nav="close"
        header={
          <>
            <ProgressBar value={completed} max={loops} />
            {/* keyed by round so the clock starts over; runs only while this round waits for an answer */}
            <TimeoutClock
              key={index}
              seconds={typeof Input.timeoutSeconds === 'function' ? Input.timeoutSeconds() : (Input.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS)}
              running={directionSet && completed === index}
              onTimeUp={() => setTimedUp(true)}
              onContinue={endLost}
            />
          </>
        }
        body={
          <div className="flex flex-1 items-center justify-center p-6">
            {/* keyed by round so the arrow spins again, even when the direction repeats */}
            <Display key={index} direction={direction} onDirectionSet={() => setSetRound(index)} />
          </div>
        }
        // fixed height so the arrow doesn't shift when the input appears
        footer={<div className={`${Input.footerHeight ?? 'h-40'} overflow-hidden`}>{directionSet && <Input key={index} onSubmit={submit} disabled={timedUp} />}</div>}
      />
      {bursts.map((b) => (
        <StarBurst key={b.id} x={b.x} y={b.y} onDone={() => setBursts((all) => all.filter((x) => x.id !== b.id))} />
      ))}
    </>
  )
}
