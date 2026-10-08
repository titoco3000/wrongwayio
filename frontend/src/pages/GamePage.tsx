import { keySoundProps } from '../components/general/keySound'
import { useState } from 'react'
import PagesStack, { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import { games } from '../components/games/minigames'
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
  const [playing, setPlaying] = useState<number | null>(null)
  const Game = playing === null ? null : games[playing].Component
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">{t('games.title')}</h1>}
      body={
        <div className="p-4">
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
