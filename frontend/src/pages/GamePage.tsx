import { keySoundProps } from '../components/general/keySound'
import { useState } from 'react'
import MarathonPage from './MarathonPage'
import PagesStack, { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import { games } from '../components/games/minigames'
import InfiniteDriveGame from '../components/games/minigames/InfiniteDriveGame'
import { Button } from '../components/general/ButtonsRow'
import { useI18n } from '../i18n'

const LOOPS = 5

/** Closeable game page, in its own stack; finishing the game closes it. */
function RoundPage({ Game }: { Game: (typeof games)[number]['Component'] }) {
  const { close } = useStack()
  return (
    <Game
      loops={LOOPS}
      onEnd={(won) => {
        console.log(won ? 'Won' : 'Lost')
        close()
      }}
    />
  )
}

export default function GamePage() {
  const { t } = useI18n()
  const [playing, setPlaying] = useState<number | 'infinite' | 'marathon' | null>(null)
  const Game =
    playing === null ? null : playing === 'infinite' ? InfiniteDriveGame : playing === 'marathon' ? MarathonPage : games[playing].Component
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">{t('games.title')}</h1>}
      body={
        <div className="p-4">
          <Button className="w-full" onClick={() => setPlaying('infinite')}>
            {t('infinite.title')}
          </Button>
          <Button className="mt-3 mb-6 w-full" onClick={() => setPlaying('marathon')}>
            {t('marathon.title')}
          </Button>
          <div className="grid grid-cols-3 gap-3">
            {games.map((g, i) => (
              <button
                key={g.nameKey}
                type="button"
                aria-label={t('games.round', { number: i + 1, name: t(g.nameKey) })}
                {...keySoundProps(() => setPlaying(i))}
                className="aspect-square cursor-pointer rounded-2xl border-2 border-b-4 border-gray-mid text-4xl transition hover:bg-gray-soft active:translate-y-0.5 active:border-b-2"
              >
                {i + 1}
              </button>
            ))}
          </div>
          {Game && <PagesStack initial={<RoundPage Game={Game} />} onEmpty={() => setPlaying(null)} />}
        </div>
      }
    />
  )
}
