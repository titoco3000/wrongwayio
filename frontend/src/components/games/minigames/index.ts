import type { ComponentType } from 'react'
import ArrowLabeledGame from './ArrowLabeledGame'
import type { GameProps } from '../components/GameRound'
import SwipeLabeledGame from './SwipeLabeledGame'
import ArrowTypingGame from './ArrowTypingGame'
import SwipeTypingGame from './SwipeTypingGame'
import DriveGame from './DriveGame'
import WordArrowGame from './WordArrowGame'
import WordSwipeGame from './WordSwipeGame'

/** `nameKey` is a translation key. Shown on the games page as numbered squares, in this order. */
export const games: { nameKey: string; Component: ComponentType<GameProps> }[] = [
  { nameKey: 'game.arrowLabeled', Component: ArrowLabeledGame },
  { nameKey: 'game.swipeLabeled', Component: SwipeLabeledGame },
  { nameKey: 'game.arrowTyping', Component: ArrowTypingGame },
  { nameKey: 'game.swipeTyping', Component: SwipeTypingGame },
  { nameKey: 'game.wordArrow', Component: WordArrowGame },
  { nameKey: 'game.wordSwipe', Component: WordSwipeGame },
  { nameKey: 'game.drive', Component: DriveGame },
]
