import type { ComponentType } from 'react'
import ArrowLabeledGame from './ArrowLabeledGame'
import ArrowUnlabeledGame from './ArrowUnlabeledGame'
import type { GameProps } from './DirectionGame'
import SwipeLabeledGame from './SwipeLabeledGame'
import SwipeUnlabeledGame from './SwipeUnlabeledGame'

/** Shown on the games page as numbered squares, in this order. */
export const games: { name: string; Component: ComponentType<GameProps> }[] = [
  { name: 'Arrow, labeled buttons', Component: ArrowLabeledGame },
  { name: 'Arrow, unlabeled buttons', Component: ArrowUnlabeledGame },
  { name: 'Swipe, labeled buttons', Component: SwipeLabeledGame },
  { name: 'Swipe, unlabeled buttons', Component: SwipeUnlabeledGame },
]
