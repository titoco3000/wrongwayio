import type { Direction } from '../displays/DirectionDisplay'

const words = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .split(/[^\p{L}]+/u)
    .filter(Boolean)

/** The direction spoken in a transcript, given the words that mean each direction in the language; the last one said wins. Null if none. */
export function matchDirection(transcript: string, directionWords: Record<Direction, string[]>): Direction | null {
  const spoken = words(transcript)
  const accepted = (direction: Direction) => directionWords[direction].flatMap(words)
  const last = (direction: Direction) => spoken.findLastIndex((w) => accepted(direction).includes(w))
  const left = last('left')
  const right = last('right')
  if (left === -1 && right === -1) return null
  return left > right ? 'left' : 'right'
}
