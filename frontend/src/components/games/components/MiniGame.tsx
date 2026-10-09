import { useRef, useState, type ReactNode } from 'react'
import type { Direction } from './displays/DirectionDisplay'
import { playSound } from '../../general/gameSound'
import ResultScreen, { type ChallengeProgress } from './ResultScreen'

export type Round = {
  /** direction the user is supposed to answer with */
  direction: Direction
  /** 0-based index of the current loop */
  index: number
  /** rounds answered correctly so far; reaches `loops` as soon as the last one is answered, before the win screen */
  completed: number
  loops: number
  /**
   * Report the user's answer. Returns whether it was correct.
   * A wrong answer loses the game; the last correct answer wins it.
   */
  answer: (value: Direction) => boolean
  /** ends the game as lost right away, without the lose screen: for callers with their own (e.g. time ran out) */
  endLost: () => void
}

export type ResultScreenProps = {
  /** call when the user is done with the screen; ends the game */
  onContinue: () => void
}

type Props = {
  loops: number
  /** called once, when the user continues from the win/lose screen */
  onEnd: (won: boolean) => void
  /** shown on the default win screen */
  progress?: ChallengeProgress
  /** renders one loop of the game */
  children: (round: Round) => ReactNode
  /** override the default screens: render any full-screen element (e.g. a Container) and call `onContinue` from it */
  winScreen?: (props: ResultScreenProps) => ReactNode
  loseScreen?: (props: ResultScreenProps) => ReactNode
  /** delay before the win screen, so the last effect can play, ms */
  winDelayMs?: number
}

const randomDirection = (): Direction => (Math.random() < 0.5 ? 'left' : 'right')

/** Plays `loops` rounds. Binary outcome: win by answering every round correctly, lose on the first mistake. */
export default function MiniGame({
  loops,
  onEnd,
  children,
  progress,
  winScreen,
  loseScreen,
  winDelayMs = 900,
}: Props) {
  const [directions] = useState(() => Array.from({ length: loops }, randomDirection))
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<'won' | 'lost' | null>(null)
  const [allAnswered, setAllAnswered] = useState(false)
  const finished = useRef(false)
  // true while the correct sound plays, before the next round starts
  const [advancing, setAdvancing] = useState(false)
  const advancingRef = useRef(false)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  const answer = (value: Direction) => {
    if (finished.current || advancingRef.current) return false
    const correct = value === directions[index]
    const sound = playSound(correct ? 'correct' : 'incorrect')
    if (!correct) {
      finished.current = true
      setResult('lost')
    } else if (index + 1 >= loops) {
      finished.current = true
      setAllAnswered(true)
      setTimeout(() => {
        playSound('win')
        setResult('won')
      }, winDelayMs)
    } else {
      advancingRef.current = true
      setAdvancing(true)
      void sound.then(() => {
        advancingRef.current = false
        setAdvancing(false)
        setIndex(index + 1)
      })
    }
    return correct
  }

  const ended = useRef(false)
  const endLost = () => {
    if (finished.current || ended.current) return
    finished.current = true
    ended.current = true
    playSound('incorrect')
    onEndRef.current(false)
  }
  const onContinue = () => {
    if (ended.current || !result) return
    ended.current = true
    onEndRef.current(result === 'won')
  }

  return (
    <>
      {children({ direction: directions[index], index, completed: index + (allAnswered || advancing ? 1 : 0), loops, answer, endLost })}
      {result === 'won' && (winScreen ? winScreen({ onContinue }) : <ResultScreen won onContinue={onContinue} progress={progress} />)}
      {result === 'lost' && (loseScreen ? loseScreen({ onContinue }) : <ResultScreen won={false} onContinue={onContinue} />)}
    </>
  )
}
