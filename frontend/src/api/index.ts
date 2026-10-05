/**
 * Stub of the backend. Same shape a real API would have (async, can fail), but the "server" is
 * a table in localStorage, so accounts only exist on this browser. Swap the bodies for fetch calls later.
 */

export type User = {
  name: string
  /** epoch ms when the premium pass runs out; null if the user never had one */
  premiumUntil: number | null
  /** who gifted the current premium pass */
  premiumFrom: string | null
}

export type ApiErrorCode = 'name-taken' | 'invalid-name' | 'not-found' | 'offline'

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

/** Waits like a network round trip, and fails like one when the device has no connection. */
const delay = async () => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('offline')
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
}

/** Text to show the user for a failed call. */
export const apiErrorMessage = (e: unknown) =>
  e instanceof ApiError && e.code === 'offline'
    ? 'You are offline. Check your connection and try again.'
    : 'Something went wrong. Try again.'

export const api = {
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
}

/** days of premium a gifted pass gives */
export const GIFT_DAYS = 30
