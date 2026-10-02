import { useState } from 'react'
import DirectionDisplay, { type Direction } from '../components/DirectionDisplay'
import DirectionWordInput, { type Point } from '../components/DirectionWordInput'
import MiniGame from '../components/MiniGame'
import ProgressBar from '../components/ProgressBar'
import StackPage from '../components/StackPage'
import StarBurst from '../components/StarBurst'

type Props = {
  loops: number
  onEnd: (won: boolean) => void
}

/** Image reaction, labeled buttons: press the button labeled like the arrow's direction. Renders a closeable page. */
export default function LabeledButtonGame({ loops, onEnd }: Props) {
  return (
    <MiniGame loops={loops} onEnd={onEnd}>
      {({ direction, index, loops, answer }) => (
        <RoundPage direction={direction} index={index} loops={loops} answer={answer} />
      )}
    </MiniGame>
  )
}

type RoundProps = { direction: Direction; index: number; loops: number; answer: (value: Direction) => boolean }

type Burst = Point & { id: number }

let nextBurst = 0

function RoundPage({ direction, index, loops, answer }: RoundProps) {
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
            <DirectionDisplay key={index} direction={direction} onDirectionSet={() => setSetRound(index)} />
          </div>
        }
        // fixed height so the arrow doesn't shift when the input appears
        footer={<div className="h-40 overflow-hidden">{directionSet && <DirectionWordInput key={index} onSubmit={submit} />}</div>}
      />
      {bursts.map((b) => (
        <StarBurst key={b.id} x={b.x} y={b.y} onDone={() => setBursts((all) => all.filter((x) => x.id !== b.id))} />
      ))}
    </>
  )
}
