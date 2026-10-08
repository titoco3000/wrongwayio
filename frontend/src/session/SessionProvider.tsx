import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type User } from '../api'
import { adoptGuestData, pendingDailySync } from '../daily/dailyChallenge'
import { applyRun, clearGuestRecords, loadGuestRecords, normalizeRecords, saveGuestRecords } from '../infinite/infiniteDrive'
import { isNative, SITE_URL } from '../native/platform'

const SESSION_KEY = 'session'

type Session = {
  /** the logged in user, or null */
  user: User | null
  /** true while the saved login is being restored */
  loading: boolean
  /** no password: the caller must have asked for a pinky promise */
  login: (user: User) => void
  logout: () => void
  /** replaces the logged in user's data, e.g. after the API changed it */
  update: (user: User) => void
}

const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside a SessionProvider')
  return ctx
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // storage unavailable: the login just isn't remembered
  }
}

/** Who is offering a premium pass, if the page was opened through a link made by `giftLink`. */
export function giftFromUrl(url?: string): string | null {
  const params = new URLSearchParams(url ? new URL(url).search : window.location.search)
  return params.get('premium') === 'gift' ? params.get('from') : null
}

/** Removes the gift from the address bar, so reloading doesn't show the invite again. */
export function clearGiftFromUrl() {
  const params = new URLSearchParams(window.location.search)
  params.delete('premium')
  params.delete('from')
  const rest = params.toString()
  window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash)
}

/** URL a friend opens to receive a premium pass from `fromName`. */
export const giftLink = (fromName: string) =>
  `${isNative() ? SITE_URL : window.location.origin}${import.meta.env.BASE_URL}?${new URLSearchParams({ premium: 'gift', from: fromName })}`

/** Keeps who is logged in. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => read(SESSION_KEY) !== null)

  useEffect(() => {
    const name = read(SESSION_KEY)
    if (!name) return
    let cancelled = false
    api
      .getUser(name)
      .then((u) => !cancelled && setUser(u))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback((u: User) => {
    write(SESSION_KEY, u.name)
    adoptGuestData(u.name)
    // the guest's records are kept where they beat the user's (the backend always has records, empty or not)
    const guest = loadGuestRecords()
    let records: ReturnType<typeof applyRun>['records'] | null = null
    if (guest) {
      const applied = applyRun(normalizeRecords(u.infiniteRecords), guest)
      clearGuestRecords()
      if (applied.broken.length > 0) records = applied.records
    }
    const daily = pendingDailySync(u.name)
    if (records || daily.length > 0) {
      // sync what this device holds with the account; a failure leaves the account as it was
      void (async () => {
        let latest = u
        if (records) {
          try {
            latest = await api.saveInfiniteRecords(u.name, records)
          } catch {
            if (guest) saveGuestRecords(guest)
          }
        }
        try {
          for (const c of daily) latest = await api.saveDailyResult(u.name, c.date, c.result, c.streak)
        } catch {
          // the local streak stays on this device; the next login tries again
        }
        if (latest !== u) setUser((current) => (current?.name === latest.name ? latest : current))
      })()
    }
    setUser(u)
  }, [])
  const logout = useCallback(() => {
    write(SESSION_KEY, null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout, update: setUser }), [user, loading, login, logout])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
