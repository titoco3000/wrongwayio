import { useMemo, useState } from 'react'
import { Button } from '../components/general/ButtonsRow'
import Container from '../components/general/Container'
import { useStack } from '../components/general/PagesStack'
import Pigeon from '../components/general/Pigeon'
import SpeechBubble from '../components/games/components/SpeechBubble'
import ProfileButton from '../components/profile/ProfileButton'
import ConfirmDialog from '../components/general/ConfirmDialog'
import { useSession } from '../session/SessionProvider'
import { loadDailyResult } from '../daily/dailyChallenge'
import DailyChallengePage from './DailyChallengePage'
import DemoPage from './DemoPage'
import GamePage from './GamePage'
import { useI18n } from '../i18n'

export default function HomePage() {
  const { push } = useStack()
  const { user } = useSession()
  const { t } = useI18n()
  // bumped when a challenge ends, to read the saved result again
  const [dailyVersion, setDailyVersion] = useState(0)
  // each user (or the guest) has their own daily result
  const dailyResult = useMemo(() => loadDailyResult(user?.name ?? null), [user, dailyVersion])
  const [confirmRepeat, setConfirmRepeat] = useState(false)
  // null: closed; record: whether finishing saves the result
  const [daily, setDaily] = useState<{ record: boolean } | null>(null)

  const dailyLabel = dailyResult === 'done' ? t('daily.done') : dailyResult === 'failed' ? t('daily.failed') : t('daily.title')
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
            <SpeechBubble side="right">{t('home.bubble')}</SpeechBubble>
            <Pigeon className="size-40" />
            <h1 className="text-4xl">WrongWayio</h1>
            <p className="text-gray-dark">{t('home.tagline')}</p>
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
              {t('home.minigames')}
            </Button>
            <Button className="w-full" variant="neutral" onClick={() => push(<DemoPage />)}>
              Component demo
            </Button>
          </div>
        }
      />
      {confirmRepeat && (
        <ConfirmDialog
          title={t('daily.repeat.title')}
          message={t('daily.repeat.message')}
          confirmLabel={t('daily.repeat.confirm')}
          cancelLabel={t('common.cancel')}
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
            setDailyVersion((v) => v + 1)
          }}
        />
      )}
    </>
  )
}
