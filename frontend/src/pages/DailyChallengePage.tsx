import { useState } from 'react'
import PagesStack, { useStack } from '../components/general/PagesStack'
import { games } from '../components/games/minigames'
import StreakScreen from '../components/games/components/StreakScreen'
import LoginPromptScreen from '../components/games/components/LoginPromptScreen'
import { api } from '../api'
import { useSession } from '../session/SessionProvider'
import BrokenStreakPage from './BrokenStreakPage'
import { DAILY_GAME_COUNT, dailyGameIndices, loadStreak, saveDailyResult, todayKey } from '../daily/dailyChallenge'

const LOOPS = 5

/** Plays the day's minigames back to back; the first loss fails the challenge. */
function Run({ record }: { record: boolean }) {
  const { close } = useStack()
  const { user, update } = useSession()
  // fixed when the run starts, so it can't change if midnight passes mid-run
  const [order] = useState(() => dailyGameIndices(games.length))
  const [step, setStep] = useState(0)
  const Game = games[order[step]].Component
  const total = Math.min(DAILY_GAME_COUNT, order.length)
  // set after the first win of the day, to show the streak screen
  const [streak, setStreak] = useState<number | null>(null)
  // set after the first loss of the day: the streak it ended
  const [lost, setLost] = useState<number | null>(null)
  // a guest is then offered to log in, so the win counts
  const [prompting, setPrompting] = useState(false)

  const finish = (result: 'done' | 'failed') => {
    const before = record ? loadStreak(user?.name ?? null) : 0
    const newStreak = record ? saveDailyResult(user?.name ?? null, result) : 0
    // the account keeps its own copy for the scoreboard; a failed sync leaves the local result as is
    if (record && user) api.saveDailyResult(user.name, todayKey(), result, result === 'done' ? newStreak : undefined).then(update).catch((e) => console.warn('daily sync failed', e))
    if (record && result === 'done') setStreak(newStreak)
    else if (before > 0) setLost(before)
    else close()
  }

  if (lost !== null) return <BrokenStreakPage streak={lost} reason="failed" onDone={close} />
  if (prompting) return <LoginPromptScreen reason="daily" onContinue={close} />
  if (streak !== null) return <StreakScreen streak={streak} onContinue={() => (user ? close() : setPrompting(true))} />

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
