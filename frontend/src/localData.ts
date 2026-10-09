/**
 * What this device remembers about a player (or the guest), in the same fields the server keeps on a user
 * (see `User` in api/index.ts), so the two are interchangeable.
 */

import type { User } from './api'

export type LocalData = Pick<User, 'currentStreakStart' | 'lastStreakCheckin' | 'largestStreak' | 'drivingHighScores'>

/** Whose data this is: a user's name, or null for a guest. */
export type Owner = string | null

const KEY_PREFIX = 'localData'

// users and the guest never share a key, whatever the user is called
export const ownerId = (owner: Owner) => (owner === null ? 'guest' : `user:${owner.trim().toLowerCase()}`)
const key = (owner: Owner) => `${KEY_PREFIX}:${ownerId(owner)}`

export const emptyLocalData = (): LocalData => ({
  currentStreakStart: null,
  lastStreakCheckin: null,
  largestStreak: 0,
  drivingHighScores: [0, 0, 0, 0, 0, 0],
})

/** Fills in whatever a stored value lacks, so old or damaged data still gives usable fields. */
export function normalizeLocalData(raw: Partial<LocalData> | null | undefined): LocalData {
  const empty = emptyLocalData()
  return {
    currentStreakStart: typeof raw?.currentStreakStart === 'string' ? raw.currentStreakStart : null,
    lastStreakCheckin: typeof raw?.lastStreakCheckin === 'string' ? raw.lastStreakCheckin : null,
    largestStreak: Number(raw?.largestStreak) || 0,
    drivingHighScores: empty.drivingHighScores.map((_, i) => Number(raw?.drivingHighScores?.[i]) || 0),
  }
}

export function loadLocalData(owner: Owner): LocalData {
  try {
    return normalizeLocalData(JSON.parse(localStorage.getItem(key(owner)) ?? 'null'))
  } catch {
    return emptyLocalData()
  }
}

export function saveLocalData(owner: Owner, data: LocalData) {
  try {
    localStorage.setItem(key(owner), JSON.stringify(data))
  } catch {
    // storage unavailable: the data just isn't remembered
  }
}

const DAY_MS = 24 * 60 * 60 * 1000
const dayNumber = (date: string) => Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / DAY_MS)

/** Days from `from` to `to`, both YYYY-MM-DD. */
export const daysBetween = (from: string, to: string) => dayNumber(to) - dayNumber(from)

/** Days won in the running streak (0 after a loss), whenever it was last played. */
export function streakLength(data: LocalData): number {
  const { currentStreakStart: start, lastStreakCheckin: last } = data
  return start && last ? Math.max(0, daysBetween(start, last) + 1) : 0
}
