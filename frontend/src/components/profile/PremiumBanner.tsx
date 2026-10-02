import { useEffect, useState } from 'react'
import type { User } from '../../api'

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/** "12 days 3 h 20 min 5 s left"; leading zero units are left out. */
export function formatTimeLeft(ms: number): string {
  const days = Math.floor(ms / DAY_MS)
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS)
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS)
  const seconds = Math.floor((ms % MINUTE_MS) / SECOND_MS)
  const parts = []
  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
  if (days > 0 || hours > 0) parts.push(`${hours} h`)
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes} min`)
  parts.push(`${seconds} s`)
  return `${parts.join(' ')} left`
}

/** True while the user's premium pass has not run out. */
export const hasPremium = (user: User, now = Date.now()) => user.premiumUntil !== null && user.premiumUntil > now

/** Flashy banner for a premium user, with the time left on the pass. Renders nothing without premium. */
export default function PremiumBanner({ user }: { user: User }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), SECOND_MS)
    return () => clearInterval(id)
  }, [])

  if (!hasPremium(user, now)) return null
  return (
    <div className="premium-banner relative overflow-hidden rounded-2xl border-4 border-ink px-5 py-3 text-center shadow-[4px_4px_0_0_var(--color-ink)]">
      <p className="text-2xl tracking-widest text-white [text-shadow:0_2px_0_rgba(0,0,0,0.4)]">★ PREMIUM ★</p>
      <p className="text-white/90 [text-shadow:0_1px_0_rgba(0,0,0,0.4)]">{formatTimeLeft(user.premiumUntil! - now)}</p>
      {user.premiumFrom && <p className="text-sm text-white/80 [text-shadow:0_1px_0_rgba(0,0,0,0.4)]">gift from {user.premiumFrom}</p>}
    </div>
  )
}
