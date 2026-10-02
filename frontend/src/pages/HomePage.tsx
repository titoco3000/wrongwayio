import { useState } from 'react'
import { Button } from '../components/general/ButtonsRow'
import Container from '../components/general/Container'
import { useStack } from '../components/general/PagesStack'
import Pigeon from '../components/general/Pigeon'
import SpeechBubble from '../components/games/components/SpeechBubble'
import ProfileButton from '../components/profile/ProfileButton'
import ConfirmDialog from '../components/general/ConfirmDialog'
import { loadDailyResult } from '../daily/dailyChallenge'
import DailyChallengePage from './DailyChallengePage'
import DemoPage from './DemoPage'
import GamePage from './GamePage'

export default function HomePage() {
  const { push } = useStack()
  const [dailyResult, setDailyResult] = useState(loadDailyResult)
  const [confirmRepeat, setConfirmRepeat] = useState(false)
  // null: closed; record: whether finishing saves the result
  const [daily, setDaily] = useState<{ record: boolean } | null>(null)

  const dailyLabel = dailyResult === 'done' ? 'Daily challenge done!' : dailyResult === 'failed' ? 'Daily challenge failed!' : 'Daily challenge'
  return (
    <>
      <Container
        header={
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xl">WrongWayio</span>
            <ProfileButton />
          </div>
        }
        body={
          <div className="flex flex-col items-center gap-6 p-6 pt-16 text-center">
            <SpeechBubble side="right">Which way is left again?</SpeechBubble>
            <Pigeon className="size-40" />
            <h1 className="text-4xl">WrongWayio</h1>
            <p className="text-gray-dark">Learn your left from your right. Eventually.</p>
          </div>
        }
        footer={
          <div className="flex flex-col gap-3 p-4">
            <Button
              className="w-full"
              variant={dailyResult === 'done' ? 'neutral' : dailyResult === 'failed' ? 'danger' : 'primary'}
              onClick={() => (dailyResult ? setConfirmRepeat(true) : setDaily({ record: true }))}
            >
              {dailyLabel}
            </Button>
            <Button className="w-full" onClick={() => push(<GamePage />)}>
              MiniGames
            </Button>
            <Button className="w-full" variant="neutral" onClick={() => push(<DemoPage />)}>
              Component demo
            </Button>
          </div>
        }
      />
      {confirmRepeat && (
        <ConfirmDialog
          title="Repeat the daily challenge?"
          message="Your saved result for today will not change."
          confirmLabel="Repeat"
          cancelLabel="Cancel"
          onCancel={() => setConfirmRepeat(false)}
          onConfirm={() => {
            setConfirmRepeat(false)
            setDaily({ record: false })
          }}
        />
      )}
      {daily && (
        <DailyChallengePage
          record={daily.record}
          onClose={() => {
            setDaily(null)
            setDailyResult(loadDailyResult())
          }}
        />
      )}
    </>
  )
}
