import { useState } from 'react'
import { useStack } from '../components/general/PagesStack'
import { Button } from '../components/general/ButtonsRow'
import Container from '../components/general/Container'
import Pigeon from '../components/general/Pigeon'
import LoginPromptScreen from '../components/games/components/LoginPromptScreen'
import { games } from '../components/games/minigames'
import { api } from '../api'
import { useI18n } from '../i18n'
import { loadGuestMarathon, saveGuestMarathon, shuffleAvoiding } from '../infinite/marathon'
import { useSession } from '../session/SessionProvider'

const LOOPS = 5

type Ended = { score: number; record: boolean }

function MarathonResult({ score, record, onContinue }: Ended & { onContinue: () => void }) {
  const { t } = useI18n()
  return (
    <Container
      body={
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
          <h1 className="text-4xl text-brand-red">{t('result.lost')}</h1>
          <Pigeon className="size-24 grayscale" />
          <div>
            <p className="text-7xl text-brand-blue">{score}</p>
            <p className="text-xl">{t('marathon.games', { count: score })}</p>
          </div>
          {record && <p className="text-xl text-brand-blue">★ {t('marathon.record')}</p>}
          <Button className="w-full max-w-xs flex-none!" onClick={onContinue}>
            {t('common.continue')}
          </Button>
        </div>
      }
    />
  )
}

/**
 * Plays every game in a random order, then every game again in a new random order, and so on, until a loss.
 * The score is the number of games won. Closing before the loss saves nothing.
 */
export default function MarathonPage() {
  const { close } = useStack()
  const { user, update } = useSession()
  const [order, setOrder] = useState(() => shuffleAvoiding(games.length))
  const [step, setStep] = useState(0)
  const [ended, setEnded] = useState<Ended | null>(null)
  // a guest who set a record is then offered to log in
  const [prompting, setPrompting] = useState(false)

  const lose = () => {
    const best = user ? (user.marathonHighScore ?? 0) : loadGuestMarathon()
    const record = step > best
    if (record) {
      if (user) api.saveMarathonRecord(user.name, step).then(update).catch((e) => console.warn('marathon sync failed', e))
      else saveGuestMarathon(step)
    }
    setEnded({ score: step, record })
  }

  if (prompting) return <LoginPromptScreen reason="record" onContinue={close} />
  if (ended) return <MarathonResult {...ended} onContinue={() => (!user && ended.record ? setPrompting(true) : close())} />

  const Game = games[order[step]].Component
  return (
    <Game
      key={step}
      loops={LOOPS}
      onEnd={(won) => {
        if (!won) return lose()
        // the list is spent: shuffle again, without opening with the game that closed the last shuffle
        if (step + 1 >= order.length) setOrder((o) => [...o, ...shuffleAvoiding(games.length, o[o.length - 1])])
        setStep(step + 1)
      }}
    />
  )
}
