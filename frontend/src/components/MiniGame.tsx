import { useRef, useState, type ReactNode } from 'react'
import type { Direction } from './DirectionDisplay'

export type Round = {
  /** direction the user is supposed to answer with */
  direction: Direction
  /** 0-based index of the current loop */
  index: number
  loops: number
  /** report the user's answer; moves to the next loop or ends the game */
  answer: (value: Direction) => void
}

type Props = {
  loops: number
  /** called once, after the last loop */
  onEnd: (score: number, loops: number) => void
  /** renders one loop of the game */
  children: (round: Round) => ReactNode
}

const randomDirection = (): Direction => (Math.random() < 0.5 ? 'left' : 'right')

/** Plays `loops` rounds, counting correct answers. */
export default function MiniGame({ loops, onEnd, children }: Props) {
  const [directions] = useState(() => Array.from({ length: loops }, randomDirection))
  const [index, setIndex] = useState(0)
  const score = useRef(0)
  const ended = useRef(false)

  const answer = (value: Direction) => {
    if (ended.current) return
    if (value === directions[index]) score.current++
    if (index + 1 >= loops) {
      ended.current = true
      onEnd(score.current, loops)
    } else {
      setIndex(index + 1)
    }
  }

  return <>{children({ direction: directions[index], index, loops, answer })}</>
}
