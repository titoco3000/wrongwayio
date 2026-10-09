import { loadLocalData, saveLocalData } from '../localData'

/** Indices 0..count-1 in random order. The first is never `previous` (the last game of the shuffle before), so no game plays twice in a row. */
export function shuffleAvoiding(count: number, previous?: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length: count }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  if (order.length > 1 && order[0] === previous) [order[0], order[order.length - 1]] = [order[order.length - 1], order[0]]
  return order
}

/** The marathon's best score: games won in a row. A guest's stays on the device, a user's on the account (`User.marathonHighScore`). */
export const loadGuestMarathon = () => loadLocalData(null).marathonHighScore

export const saveGuestMarathon = (score: number) => saveLocalData(null, { ...loadLocalData(null), marathonHighScore: score })

export const clearGuestMarathon = () => saveGuestMarathon(0)
