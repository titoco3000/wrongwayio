import { useEffect, useState } from 'react'
import { api, apiErrorMessage, scoreboardValue, type ScoreboardEntry, type ScoreboardKind } from '../api'
import StackPage from '../components/general/StackPage'
import { DRIVE_GEARS, formatClock } from '../infinite/infiniteDrive'
import { useI18n } from '../i18n'
import { useSession } from '../session/SessionProvider'

type Tab = 'streak' | 'driving'
const TABS: Tab[] = ['streak', 'driving']
/** Driving sub-tabs: overall, then each gear. */
const SUBTABS: ScoreboardKind[] = ['score', ...DRIVE_GEARS.map((g) => `gear-${g}` as const)]

type TabsProps<T extends string> = {
  items: readonly T[]
  value: T
  label: (item: T) => string
  onChange: (item: T) => void
  className: string
}

function Tabs<T extends string>({ items, value, label, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={className}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={item === value}
          onClick={() => onChange(item)}
          className={`cursor-pointer rounded-xl border-2 px-2 py-2 text-sm ${
            item === value ? 'border-brand-blue text-brand-blue' : 'border-gray-soft text-gray-dark hover:bg-gray-soft'
          }`}
        >
          {label(item)}
        </button>
      ))}
    </div>
  )
}

/** Top players of the daily challenge streak, and of infinite driving overall and in each gear. */
export default function ScoreboardPage() {
  const { t } = useI18n()
  const { user } = useSession()
  const [tab, setTab] = useState<Tab>('streak')
  const [sub, setSub] = useState<ScoreboardKind>('score')
  const kind: ScoreboardKind = tab === 'streak' ? 'streak' : sub
  // null while loading
  const [entries, setEntries] = useState<ScoreboardEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setEntries(null)
    setError(null)
    api
      .getScoreboard(kind)
      .then((list) => !cancelled && setEntries(list))
      .catch((e) => !cancelled && setError(apiErrorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [kind])

  const show = (e: ScoreboardEntry) =>
    kind === 'streak' ? t('scoreboard.days', { count: e.longestStreak }) : kind === 'score' ? `${e.score} · ${formatClock(e.ms)}` : scoreboardValue(e, kind)

  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">{t('scoreboard.title')}</h1>}
      body={
        <div className="flex flex-col gap-4 p-4">
          <Tabs items={TABS} value={tab} label={(k) => t(`scoreboard.${k}`)} onChange={setTab} className="grid grid-cols-2 gap-2" />
          {tab === 'driving' && (
            <Tabs
              items={SUBTABS}
              value={sub}
              label={(k) => (k === 'score' ? t('scoreboard.general') : t(`scoreboard.${k}`))}
              onChange={setSub}
              className="grid grid-cols-4 gap-2"
            />
          )}
          {error && <p role="alert">{error}</p>}
          {!error && entries === null && <p className="text-gray-dark">...</p>}
          {entries?.length === 0 && <p className="text-gray-dark">{t('scoreboard.empty')}</p>}
          {!!entries?.length && (
            <ol className="flex flex-col gap-2">
              {entries.map((e, i) => (
                <li
                  key={e.name}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-2 ${
                    e.name.toLowerCase() === user?.name.toLowerCase() ? 'border-brand-blue' : 'border-gray-soft'
                  }`}
                >
                  <span className="w-8 text-gray-dark">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{e.name}</span>
                  <span className="text-xl">{show(e)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      }
    />
  )
}
