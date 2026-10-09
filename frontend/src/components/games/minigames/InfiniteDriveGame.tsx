import { useEffect, useRef, useState } from 'react'
import AudioDisplay from '../components/displays/AudioDisplay'
import Drive from '../components/displays/Drive'
import type { Direction } from '../components/displays/DirectionDisplay'
import SpeechBubbleDisplay from '../components/displays/SpeechBubbleDisplay'
import type { GameProps } from '../components/GameRound'
import InfiniteResultScreen from '../components/InfiniteResultScreen'
import LoginPromptScreen from '../components/LoginPromptScreen'
import { playSound } from '../../general/gameSound'
import StackPage from '../../general/StackPage'
import { useI18n } from '../../../i18n'
import { useSession } from '../../../session/SessionProvider'
import { api } from '../../../api'
import {
  applyRun,
  driveGear,
  emptyByGear,
  formatClock,
  loadGuestRecords,
  normalizeRecords,
  recordsFromScores,
  saveGuestRecords,
  type BrokenRecord,
  type DriveGear,
  type Run,
} from '../../../infinite/infiniteDrive'

const randomDirection = (): Direction => (Math.random() < 0.5 ? 'left' : 'right')

type Ended = { cause: 'wrong' | 'crash'; run: Run; broken: BrokenRecord[] }

/**
 * Special mode: no rounds to finish. A speech bubble AND a voice say a direction, over and over, until
 * a wrong exit or a crash. Counts the score and the time; each point is also counted under the gear it was made in.
 * `loops` is ignored.
 */
export default function InfiniteDriveGame({ onEnd }: GameProps) {
  const { t } = useI18n()
  const { user, update } = useSession()

  const [round, setRound] = useState({ index: 0, direction: randomDirection() })
  // index of the round whose bubble arrived: the answer counts only after it
  const [shownRound, setShownRound] = useState(-1)
  // the first round waits for the first event (crash, left or right), which isn't graded and starts the clock
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now)
  const [score, setScore] = useState(0)
  const [ended, setEnded] = useState<Ended | null>(null)
  // after a record, a guest is offered to log in
  const [prompting, setPrompting] = useState(false)

  // read by the car's callbacks, which must see the latest values without re-rendering the road
  const scoreRef = useRef(0)
  const byGear = useRef(emptyByGear())
  const gear = useRef<DriveGear>('1')
  const finished = useRef(false)
  const advancing = useRef(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (startedAt === null || ended) return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [startedAt, ended])

  const waiting = startedAt === null
  const listening = !waiting && shownRound === round.index && !ended

  const finish = (cause: Ended['cause']) => {
    if (finished.current) return
    finished.current = true
    const run: Run = { score: scoreRef.current, ms: Date.now() - (startedAt ?? Date.now()), byGear: { ...byGear.current } }
    const { records, broken } = applyRun(user ? recordsFromScores(user.drivingHighScores) : normalizeRecords(loadGuestRecords()), run)
    if (broken.length > 0) {
      if (user) api.saveInfiniteRecords(user.name, records).then(update).catch((e) => console.warn('records sync failed', e))
      else saveGuestRecords(records)
    }
    setEnded({ cause, run, broken })
  }

  const leave = () => {
    if (doneRef.current) return
    doneRef.current = true
    onEnd(false)
  }

  const start = () => {
    const at = Date.now()
    setStartedAt(at)
    setNow(at)
  }

  const answer = (side: Direction) => {
    if (advancing.current) return
    if (side !== round.direction) {
      playSound('incorrect')
      return finish('wrong')
    }
    advancing.current = true
    void playSound('correct').then(() => {
      advancing.current = false
      setRound((r) => ({ index: r.index + 1, direction: randomDirection() }))
    })
    scoreRef.current += 1
    byGear.current[gear.current] += 1
    setScore(scoreRef.current)
  }

  return (
    <>
      <StackPage
        nav="close"
        header={
          <div className="flex flex-1 items-center justify-between text-xl">
            <span>
              {t('infinite.time')} <b>{formatClock(startedAt === null ? 0 : (ended?.run.ms ?? now - startedAt))}</b>
            </span>
            <span>
              {t('infinite.score')} <b>{score}</b>
            </span>
          </div>
        }
        body={
          <div className="flex flex-col gap-4 p-6">
            <div className="flex min-h-28 items-center gap-3">
              {/* keyed by round so both come in again, even when the direction repeats */}
              {!waiting && (
                <>
                  <div className="min-w-0 flex-1">
                    <SpeechBubbleDisplay key={round.index} direction={round.direction} onDirectionSet={() => setShownRound(round.index)} />
                  </div>
                  <AudioDisplay key={`audio${round.index}`} direction={round.direction} size="size-20" />
                </>
              )}
            </div>
            <Drive
              onGear={(g) => (gear.current = driveGear(g))}
              onExit={(side) => {
                // leaving through the back is neither answer; the car just goes around again
                if (side === 'back') return
                if (waiting) return start()
                if (listening) answer(side)
              }}
              onCrash={() => {
                if (waiting) return start()
                if (listening) finish('crash')
              }}
            />
          </div>
        }
      />
      {ended && (
        <InfiniteResultScreen
          {...ended}
          onContinue={() => (!user && ended.broken.length > 0 ? setPrompting(true) : leave())}
        />
      )}
      {prompting && <LoginPromptScreen reason="record" onContinue={leave} />}
    </>
  )
}
