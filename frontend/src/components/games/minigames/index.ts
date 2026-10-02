import type { ComponentType } from 'react'
import ArrowLabeledGame from './ArrowLabeledGame'
import type { GameProps } from '../components/GameRound'
import SwipeLabeledGame from './SwipeLabeledGame'
import ArrowTypingGame from './ArrowTypingGame'
import SwipeTypingGame from './SwipeTypingGame'
import WordArrowGame from './WordArrowGame'
import WordSwipeGame from './WordSwipeGame'

/** Shown on the games page as numbered squares, in this order. */
export const games: { name: string; Component: ComponentType<GameProps> }[] = [
  { name: 'Arrow, labeled buttons', Component: ArrowLabeledGame },
  { name: 'Swipe, labeled buttons', Component: SwipeLabeledGame },
  { name: 'Arrow, typing', Component: ArrowTypingGame },
  { name: 'Swipe, typing', Component: SwipeTypingGame },
  { name: 'Word, arrow buttons', Component: WordArrowGame },
  { name: 'Word, swipe', Component: WordSwipeGame },
]
