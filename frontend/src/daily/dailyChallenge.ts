export const DAILY_GAME_COUNT = 5

export type DailyResult = 'done' | 'failed'

const STORAGE_KEY = 'dailyChallenge'
const STREAK_KEY = 'dailyStreak'

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

/** Today's saved result, or null if not played yet (or the saved one is from another day). */
export function loadDailyResult(): DailyResult | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return saved?.date === todayKey() && (saved.result === 'done' || saved.result === 'failed') ? saved.result : null
  } catch {
    return null
  }
}

type Streak = { count: number; lastDate: string }

/** Consecutive days with a won challenge, ending today or yesterday; 0 once a day was missed or lost. */
export function loadStreak(): number {
  try {
    const saved: Streak | null = JSON.parse(localStorage.getItem(STREAK_KEY) ?? 'null')
    return saved && (saved.lastDate === todayKey() || saved.lastDate === yesterdayKey()) ? saved.count : 0
  } catch {
    return 0
  }
}

/** Saves today's result. Returns the streak after a win, so it can be shown right away. */
export function saveDailyResult(result: DailyResult): number {
  const streak = result === 'done' ? loadStreak() + 1 : 0
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), result }))
    if (result === 'done') localStorage.setItem(STREAK_KEY, JSON.stringify({ count: streak, lastDate: todayKey() } satisfies Streak))
  } catch {
    // storage unavailable: the result just isn't remembered
  }
  return streak
}
