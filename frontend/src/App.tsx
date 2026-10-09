import { useEffect, useState } from 'react'
import { onOpenedWithUrl } from './native/appEvents'
import PagesStack from './components/general/PagesStack'
import Splash from './components/app/Splash'
import HomePage from './pages/HomePage'
import InvitePage from './pages/InvitePage'
import BrokenStreakPage from './pages/BrokenStreakPage'
import { markBrokenStreakSeen, unseenBrokenStreak } from './daily/dailyChallenge'
import { clearGiftFromUrl, giftFromUrl, SessionProvider, useSession } from './session/SessionProvider'

export default function App() {
  // someone opened a gift link: the invite comes before the home screen
  const [gift, setGift] = useState(() => giftFromUrl())
  // the installed app gets links as events instead of page loads
  useEffect(() => onOpenedWithUrl((url) => setGift(giftFromUrl(url) ?? null)), [])
  return (
    <Splash>
      <SessionProvider>
        <Pages gift={gift} onGiftDone={() => {
          clearGiftFromUrl()
          setGift(null)
        }} />
      </SessionProvider>
    </Splash>
  )
}

function Pages({ gift, onGiftDone }: { gift: string | null; onGiftDone: () => void }) {
  const { user, loading } = useSession()
  const owner = user?.name ?? null
  // days of a streak lost to a missed day, told once when the app opens (after the saved login is restored)
  const [lost, setLost] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  if (!loading && !checked) {
    setChecked(true)
    setLost(unseenBrokenStreak(owner) || null)
  }
  const dismiss = () => {
    markBrokenStreakSeen(owner)
    setLost(null)
  }
  if (loading) return null
  return (
    <PagesStack
      // the stack only reads `initial` when it mounts, so switching pages remounts it
      key={gift ? 'invite' : lost ? 'broken' : 'home'}
      initial={
        gift ? (
          <InvitePage from={gift} onDone={onGiftDone} />
        ) : lost ? (
          <BrokenStreakPage streak={lost} onDone={dismiss} />
        ) : (
          <HomePage />
        )
      }
    />
  )
}
