import { useState } from 'react'
import Drive from '../components/displays/Drive'
import type { Direction } from '../components/displays/DirectionDisplay'
import SpeechBubbleDisplay from '../components/displays/SpeechBubbleDisplay'
import type { GameProps } from '../components/GameRound'
import MiniGame from '../components/MiniGame'
import ProgressBar from '../../general/ProgressBar'
import StackPage from '../../general/StackPage'

/** A speech bubble says a direction; steer the car out of the central tile through that side. */
export default function DriveGame({ loops, onEnd, progress }: GameProps) {
  return (
    <MiniGame loops={loops} onEnd={onEnd} progress={progress}>
      {({ direction, index, completed, loops, answer }) => (
        <DriveRound direction={direction} index={index} completed={completed} loops={loops} answer={answer} />
      )}
    </MiniGame>
  )
}

type RoundProps = {
  direction: Direction
  index: number
  completed: number
  loops: number
  answer: (value: Direction) => boolean
}

function DriveRound({ direction, index, completed, loops, answer }: RoundProps) {
  // index of the round whose bubble arrived; derived so the page stays mounted between rounds
  const [setRound, setSetRound] = useState(-1)
  const listening = setRound === index && completed === index

  return (
    <StackPage
      nav="close"
      header={<ProgressBar value={completed} max={loops} />}
      body={
        <div className="flex flex-col gap-4 p-6">
          <div className="min-h-28">
            {/* keyed by round so the bubble comes in again, even when the direction repeats */}
            <SpeechBubbleDisplay key={index} direction={direction} onDirectionSet={() => setSetRound(index)} />
          </div>
          <Drive
            onExit={(side) => {
              // Leaving through the back is neither answer; the car just goes around again.
              if (listening && side !== 'back') answer(side)
            }}
            // Crashing is a wrong answer: the opposite side can never be the asked one.
            onCrash={() => listening && answer(direction === 'left' ? 'right' : 'left')}
          />
        </div>
      }
    />
  )
}
