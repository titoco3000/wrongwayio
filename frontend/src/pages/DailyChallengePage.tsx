import { useState } from 'react'
import PagesStack, { useStack } from '../components/general/PagesStack'
import { games } from '../components/games/minigames'
import StreakScreen from '../components/games/components/StreakScreen'
import { DAILY_GAME_COUNT, dailyGameIndices, saveDailyResult } from '../daily/dailyChallenge'

const LOOPS = 5

/** Plays the day's minigames back to back; the first loss fails the challenge. */
function Run({ record }: { record: boolean }) {
  const { close } = useStack()
  // fixed when the run starts, so it can't change if midnight passes mid-run
  const [order] = useState(() => dailyGameIndices(games.length))
  const [step, setStep] = useState(0)
  const Game = games[order[step]].Component
  const total = Math.min(DAILY_GAME_COUNT, order.length)
  // set after the first win of the day, to show the streak screen
  const [streak, setStreak] = useState<number | null>(null)

  const finish = (result: 'done' | 'failed') => {
    const newStreak = record ? saveDailyResult(result) : 0
    if (record && result === 'done') setStreak(newStreak)
    else close()
  }

  if (streak !== null) return <StreakScreen streak={streak} onContinue={close} />

  return (
    <Game
      key={step}
      loops={LOOPS}
      progress={{ completed: step + 1, total }}
      onEnd={(won) => {
        if (!won) finish('failed')
        else if (step + 1 >= total) finish('done')
        else setStep(step + 1)
      }}
    />
  )
}

type Props = {
  /** false when repeating an already-finished challenge: the saved result stays as it was */
  record: boolean
  onClose: () => void
}

/** Closeable daily challenge, in its own stack. Closing before the end saves nothing. */
export default function DailyChallengePage({ record, onClose }: Props) {
  return <PagesStack initial={<Run record={record} />} onEmpty={onClose} />
}
