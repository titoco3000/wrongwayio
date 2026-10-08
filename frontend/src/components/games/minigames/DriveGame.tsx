import { useState } from 'react'
import Drive from '../components/displays/Drive'
import type { Direction } from '../components/displays/DirectionDisplay'
import SpeechBubbleDisplay from '../components/displays/SpeechBubbleDisplay'
import type { GameProps } from '../components/GameRound'
import MiniGame from '../components/MiniGame'
import ResultScreen from '../components/ResultScreen'
import ProgressBar from '../../general/ProgressBar'
import StackPage from '../../general/StackPage'

/** A speech bubble says a direction; steer the car out of the central tile through that side. */
export default function DriveGame({ loops, onEnd, progress }: GameProps) {
  // set when the losing answer came from hitting a wall, so the lose screen can say so
  const [crashed, setCrashed] = useState(false)
  return (
    <MiniGame
      loops={loops}
      onEnd={onEnd}
      progress={progress}
      loseScreen={({ onContinue }) => (
        <ResultScreen won={false} onContinue={onContinue} title={crashed ? 'You crashed!' : undefined} />
      )}
    >
      {({ direction, index, completed, loops, answer }) => (
        <DriveRound
          direction={direction}
          index={index}
          completed={completed}
          loops={loops}
          answer={answer}
          onCrashed={() => setCrashed(true)}
        />
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
  /** called when a crash is about to be graded as the wrong answer */
  onCrashed: () => void
}

function DriveRound({ direction, index, completed, loops, answer, onCrashed }: RoundProps) {
  // index of the round whose bubble arrived; derived so the page stays mounted between rounds
  const [setRound, setSetRound] = useState(-1)
  // The very first bubble waits for the first event (crash, left or right), which isn't graded.
  const [started, setStarted] = useState(false)
  const waiting = index === 0 && !started
  const listening = setRound === index && completed === index

  return (
    <StackPage
      nav="close"
      header={<ProgressBar value={completed} max={loops} />}
      body={
        <div className="flex flex-col gap-4 p-6">
          <div className="min-h-28">
            {/* keyed by round so the bubble comes in again, even when the direction repeats */}
            {!waiting && (
              <SpeechBubbleDisplay key={index} direction={direction} onDirectionSet={() => setSetRound(index)} />
            )}
          </div>
          <Drive
            onExit={(side) => {
              if (waiting) {
                if (side !== 'back') setStarted(true)
                return
              }
              // Leaving through the back is neither answer; the car just goes around again.
              if (listening && side !== 'back') answer(side)
            }}
            // Crashing is a wrong answer: the opposite side can never be the asked one.
            onCrash={() => {
              if (waiting) return setStarted(true)
              if (!listening) return
              onCrashed()
              answer(direction === 'left' ? 'right' : 'left')
            }}
          />
        </div>
      }
    />
  )
}
