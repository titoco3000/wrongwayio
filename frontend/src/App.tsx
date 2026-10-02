import { useState } from 'react'
import PagesStack from './components/general/PagesStack'
import Splash from './components/app/Splash'
import HomePage from './pages/HomePage'
import InvitePage from './pages/InvitePage'
import { clearGiftFromUrl, giftFromUrl, SessionProvider } from './session/SessionProvider'

export default function App() {
  // someone opened a gift link: the invite comes before the home screen
  const [gift, setGift] = useState(giftFromUrl)
  return (
    <Splash>
      <SessionProvider>
        <PagesStack
          // the stack only reads `initial` when it mounts, so switching to the home screen remounts it
          key={gift ? 'invite' : 'home'}
          initial={
            gift ? (
              <InvitePage
                from={gift}
                onDone={() => {
                  clearGiftFromUrl()
                  setGift(null)
                }}
              />
            ) : (
              <HomePage />
            )
          }
        />
      </SessionProvider>
    </Splash>
  )
}
