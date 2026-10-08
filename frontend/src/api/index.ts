/**
 * Client of the backend (see /backend). With `VITE_API_URL` set, calls go to it; without, the "server" is
 * a table in localStorage, so accounts only exist on this browser. Same shape either way (async, can fail).
 */

import { t } from '../i18n'
import { normalizeRecords, type DriveGear, type Records as InfiniteRecords } from '../infinite/infiniteDrive'

export type User = {
  name: string
  /** epoch ms when the premium pass runs out; null if the user never had one */
  premiumUntil: number | null
  /** who gifted the current premium pass */
  premiumFrom: string | null
  /** best results of infinite driving; missing until the first run (and on accounts made before it existed) */
  infiniteRecords?: InfiniteRecords | null
  /** the last daily challenge played; its date is the player's local day, YYYY-MM-DD */
  daily?: { date: string; result: 'done' | 'failed' } | null
  /** longest run of days with a won daily challenge */
  longestStreak?: number
}

/** One row of the scoreboard. */
export type ScoreboardEntry = { name: string; score: number; ms: number; longestStreak: number; byGear: InfiniteRecords['byGear'] }
/** `score` is infinite driving overall, `gear-X` its points in one gear */
export type ScoreboardKind = 'score' | 'streak' | `gear-${DriveGear}`

export type ApiErrorCode = 'name-taken' | 'invalid-name' | 'not-found' | 'offline' | 'server'

export class ApiError extends Error {
  code: ApiErrorCode
  constructor(code: ApiErrorCode) {
    super(code)
    this.code = code
  }
}

const TABLE_KEY = 'stubApi:users'
const LATENCY_MS = 400
const DAY_MS = 24 * 60 * 60 * 1000

export const NAME_MIN = 2
export const NAME_MAX = 20

/** Trims and collapses spaces. */
export const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ')

export const isValidName = (name: string) => cleanName(name).length >= NAME_MIN && cleanName(name).length <= NAME_MAX

// names are unique regardless of case
const keyOf = (name: string) => cleanName(name).toLowerCase()

type Table = Record<string, User>

const readTable = (): Table => {
  try {
    return JSON.parse(localStorage.getItem(TABLE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const writeTable = (table: Table) => {
  try {
    localStorage.setItem(TABLE_KEY, JSON.stringify(table))
  } catch {
    // storage unavailable: the change is lost, like a server that dropped the write
  }
}

/** What a board ranks an entry by. */
export const scoreboardValue = (e: ScoreboardEntry, by: ScoreboardKind) =>
  by === 'score' ? e.score : by === 'streak' ? e.longestStreak : e.byGear[by.slice(5) as DriveGear]

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || null

const CODES: readonly ApiErrorCode[] = ['name-taken', 'invalid-name', 'not-found']

/** One call to the backend. No connection is `offline`; an error body's `code` becomes the ApiError's. */
async function request<T>(path: string, body?: unknown): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('offline')
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('offline')
  }
  if (!res.ok) {
    const code = (await res.json().catch(() => null))?.code
    throw new ApiError(CODES.includes(code) ? code : 'server')
  }
  return res.json()
}

const userPath = (name: string) => `/users/${encodeURIComponent(cleanName(name))}`

/** Waits like a network round trip, and fails like one when the device has no connection. */
const delay = async () => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('offline')
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
}

/** Text to show the user for a failed call. */
export const apiErrorMessage = (e: unknown) =>
  e instanceof ApiError && e.code === 'offline'
    ? t('error.offline')
    : t('error.generic')

const stubApi = {
  /** The user with that name, or null if there is none. */
  async getUser(name: string): Promise<User | null> {
    await delay()
    return readTable()[keyOf(name)] ?? null
  },

  /** Creates the account. Throws `name-taken` if someone already has that name. */
  async createUser(name: string): Promise<User> {
    await delay()
    if (!isValidName(name)) throw new ApiError('invalid-name')
    const table = readTable()
    if (table[keyOf(name)]) throw new ApiError('name-taken')
    const user: User = { name: cleanName(name), premiumUntil: null, premiumFrom: null }
    writeTable({ ...table, [keyOf(name)]: user })
    return user
  },

  /** Replaces the user's infinite driving records. */
  async saveInfiniteRecords(name: string, records: InfiniteRecords): Promise<User> {
    await delay()
    const table = readTable()
    const user = table[keyOf(name)]
    if (!user) throw new ApiError('not-found')
    const updated: User = { ...user, infiniteRecords: records }
    writeTable({ ...table, [keyOf(name)]: updated })
    return updated
  },

  /** Adds `days` of premium, on top of whatever is left. */
  async grantPremium(name: string, from: string, days: number): Promise<User> {
    await delay()
    const table = readTable()
    const user = table[keyOf(name)]
    if (!user) throw new ApiError('not-found')
    const start = Math.max(Date.now(), user.premiumUntil ?? 0)
    const updated: User = { ...user, premiumUntil: start + days * DAY_MS, premiumFrom: from }
    writeTable({ ...table, [keyOf(name)]: updated })
    return updated
  },

  /** Records today's daily challenge result. The stub keeps results on this device only, so there is nothing to do. */
  async saveDailyResult(name: string, _date: string, _result: 'done' | 'failed', _streak?: number): Promise<User> {
    await delay()
    const user = readTable()[keyOf(name)]
    if (!user) throw new ApiError('not-found')
    return user
  },

  /** The best players, best first; players with nothing on the board are left off. */
  async getScoreboard(by: ScoreboardKind): Promise<ScoreboardEntry[]> {
    await delay()
    const value = (e: ScoreboardEntry) => scoreboardValue(e, by)
    return Object.values(readTable())
      .map((u) => ({
        name: u.name,
        score: u.infiniteRecords?.score ?? 0,
        ms: u.infiniteRecords?.ms ?? 0,
        longestStreak: u.longestStreak ?? 0,
        byGear: normalizeRecords(u.infiniteRecords).byGear,
      }))
      .filter((e) => value(e) > 0)
      .sort((a, b) => value(b) - value(a) || a.name.localeCompare(b.name))
  },
}

const realApi: typeof stubApi = {
  async getUser(name) {
    try {
      return await request<User>(userPath(name))
    } catch (e) {
      if (e instanceof ApiError && e.code === 'not-found') return null
      throw e
    }
  },
  createUser: (name) => request<User>('/users', { name: cleanName(name) }),
  saveInfiniteRecords: (name, records) => request<User>(`${userPath(name)}/infinite`, records),
  saveDailyResult: (name, date, result, streak) => request<User>(`${userPath(name)}/daily`, { date, result, streak }),
  grantPremium: (name, from, days) => request<User>(`${userPath(name)}/premium`, { from, days }),
  getScoreboard: (by) => request<ScoreboardEntry[]>(`/scoreboard?by=${by}`),
}

export const api = API_URL ? realApi : stubApi

/** days of premium a gifted pass gives */
export const GIFT_DAYS = 30
