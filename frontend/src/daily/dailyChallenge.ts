import { daysBetween, emptyLocalData, loadLocalData, ownerId, saveLocalData, streakLength, type Owner } from '../localData'

export const DAILY_GAME_COUNT = 5

export type DailyResult = 'done' | 'failed'

export type { Owner }

/** Local calendar date as YYYY-MM-DD. */
export const todayKey = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

/** The calendar day before `now`, as YYYY-MM-DD. */
const yesterdayKey = (now = new Date()) => {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

/** Seeded PRNG (mulberry32) from a string seed. */
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
  let a = (h << 13) | (h >>> 19)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Indices of the day's minigames: distinct, same for everyone on the same date. */
export function dailyGameIndices(gameCount: number, date = todayKey()): number[] {
  const random = seededRandom(date)
  const all = Array.from({ length: gameCount }, (_, i) => i)
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all.slice(0, DAILY_GAME_COUNT)
}

/** Today's saved result, or null if not played yet. A loss is a check-in today with no running streak. */
export function loadDailyResult(owner: Owner): DailyResult | null {
  const data = loadLocalData(owner)
  if (data.lastStreakCheckin !== todayKey()) return null
  return data.currentStreakStart === null ? 'failed' : 'done'
}

/** Consecutive days with a won challenge, ending today or yesterday; 0 once a day was missed or lost. */
export function loadStreak(owner: Owner): number {
  const data = loadLocalData(owner)
  return data.lastStreakCheckin === todayKey() || data.lastStreakCheckin === yesterdayKey() ? streakLength(data) : 0
}

const seenKey = (owner: Owner) => `brokenStreakSeen:${ownerId(owner)}`

/** Days of the streak lost by missing yesterday, or 0 if nothing was lost or the player was already told. */
export function unseenBrokenStreak(owner: Owner): number {
  const data = loadLocalData(owner)
  const last = data.lastStreakCheckin
  if (!last || last >= yesterdayKey()) return 0
  try {
    if (localStorage.getItem(seenKey(owner)) === last) return 0
  } catch {
    // storage unavailable: the page may show again
  }
  return streakLength(data)
}

/** Remembers the player was told about the streak they lost, so the page shows once per broken streak. */
export function markBrokenStreakSeen(owner: Owner) {
  const last = loadLocalData(owner).lastStreakCheckin
  if (!last) return
  try {
    localStorage.setItem(seenKey(owner), last)
  } catch {
    // storage unavailable: the page may show again
  }
}

/** Saves today's result, like the server does: the first result of a day counts. Returns the streak after a win. */
export function saveDailyResult(owner: Owner, result: DailyResult): number {
  const data = loadLocalData(owner)
  const today = todayKey()
  if (data.lastStreakCheckin !== null && data.lastStreakCheckin >= today) return loadStreak(owner)
  if (result === 'done') {
    const continues = data.currentStreakStart !== null && data.lastStreakCheckin === yesterdayKey()
    if (!continues) data.currentStreakStart = today
    data.largestStreak = Math.max(data.largestStreak, daysBetween(data.currentStreakStart!, today) + 1)
  } else {
    data.currentStreakStart = null
  }
  data.lastStreakCheckin = today
  saveLocalData(owner, data)
  return loadStreak(owner)
}

type Sync = { date: string; result: DailyResult; streak?: number }

/** What a new login must tell the server, oldest first: the streak the device holds, and today's loss if any. */
export function pendingDailySync(owner: Owner): Sync[] {
  const calls: Sync[] = []
  const streak = loadStreak(owner)
  const last = loadLocalData(owner).lastStreakCheckin
  if (streak > 0 && last) calls.push({ date: last, result: 'done', streak })
  if (loadDailyResult(owner) === 'failed') calls.push({ date: todayKey(), result: 'failed' })
  return calls
}

const hasDailyData = (owner: Owner) => loadLocalData(owner).lastStreakCheckin !== null

/** On login: a user with no streak data of their own takes over the guest's, which is then cleared (the guest's scores stay). */
export function adoptGuestData(userName: string) {
  if (hasDailyData(userName) || !hasDailyData(null)) return
  const guest = loadLocalData(null)
  saveLocalData(userName, { ...loadLocalData(userName), currentStreakStart: guest.currentStreakStart, lastStreakCheckin: guest.lastStreakCheckin, largestStreak: guest.largestStreak })
  const { currentStreakStart, lastStreakCheckin, largestStreak } = emptyLocalData()
  saveLocalData(null, { ...guest, currentStreakStart, lastStreakCheckin, largestStreak })
}
