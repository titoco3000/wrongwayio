import { useState } from 'react'
import { type ComponentType } from 'react'
import type { Direction } from '../components/DirectionDisplay'
import MiniGame from '../components/MiniGame'
import ProgressBar from '../components/ProgressBar'
import StackPage from '../components/StackPage'
import StarBurst from '../components/StarBurst'
import type { Point } from '../components/useClickOrigin'

/** Shows the direction, then calls onDirectionSet. Remounted every round. */
export type DisplayComponent = ComponentType<{ direction: Direction; onDirectionSet: (direction: Direction) => void }>
/** Mounted once the direction is set; reports the user's answer and where it was pressed. */
export type InputComponent = ComponentType<{ onSubmit: (direction: Direction, origin: Point) => void }>

export type GameProps = {
  loops: number
  onEnd: (won: boolean) => void
}

type Props = GameProps & { Display: DisplayComponent; Input: InputComponent }

/** Generic reaction game: pick a display and an input. Renders a closeable page. */
export default function DirectionGame({ loops, onEnd, Display, Input }: Props) {
  return (
    <MiniGame loops={loops} onEnd={onEnd}>
      {({ direction, index, loops, answer }) => (
        <RoundPage Display={Display} Input={Input} direction={direction} index={index} loops={loops} answer={answer} />
      )}
    </MiniGame>
  )
}

type RoundProps = { Display: DisplayComponent; Input: InputComponent; direction: Direction; index: number; loops: number; answer: (value: Direction) => boolean }

type Burst = Point & { id: number }

let nextBurst = 0

function RoundPage({ Display, Input, direction, index, loops, answer }: RoundProps) {
  // index of the round whose arrow finished spinning; derived so the page (and its progress bar) stays mounted between rounds
  const [setRound, setSetRound] = useState(-1)
  const directionSet = setRound === index
  // lives here (not in the input) so stars keep flying after the next round replaces the input
  const [bursts, setBursts] = useState<Burst[]>([])

  const submit = (value: Direction, origin: Point) => {
    if (answer(value)) setBursts((b) => [...b, { ...origin, id: nextBurst++ }])
  }

  return (
    <>
      <StackPage
        nav="close"
        header={<ProgressBar value={index} max={loops} />}
        body={
          <div className="flex flex-1 items-center justify-center p-6">
            {/* keyed by round so the arrow spins again, even when the direction repeats */}
            <Display key={index} direction={direction} onDirectionSet={() => setSetRound(index)} />
          </div>
        }
        // fixed height so the arrow doesn't shift when the input appears
        footer={<div className="h-40 overflow-hidden">{directionSet && <Input key={index} onSubmit={submit} />}</div>}
      />
      {bursts.map((b) => (
        <StarBurst key={b.id} x={b.x} y={b.y} onDone={() => setBursts((all) => all.filter((x) => x.id !== b.id))} />
      ))}
    </>
  )
}
