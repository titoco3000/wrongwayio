import { useState } from 'react'
import { api, GIFT_DAYS } from '../api'
import { Button } from '../components/general/ButtonsRow'
import Container from '../components/general/Container'
import { useStack } from '../components/general/PagesStack'
import Pigeon from '../components/general/Pigeon'
import PremiumBanner from '../components/profile/PremiumBanner'
import { useSession } from '../session/SessionProvider'
import LoginPage from './LoginPage'

type Props = {
  /** name of the person who sent the gift */
  from: string
  /** called when the user is done with the invite and should see the home screen */
  onDone: () => void
}

/** Shown instead of the home screen when the page was opened through a gift link. */
export default function InvitePage({ from, onDone }: Props) {
  const { push } = useStack()
  const { user, loading, update } = useSession()
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const ownLink = user?.name.toLowerCase() === from.toLowerCase()

  const accept = async () => {
    if (!user) return
    setBusy(true)
    try {
      update(await api.grantPremium(user.name, from, GIFT_DAYS))
      setAccepted(true)
    } finally {
      setBusy(false)
    }
  }

  let message: string
  let action: React.ReactNode
  if (loading) {
    message = '...'
    action = null
  } else if (accepted && user) {
    message = `Enjoy the glory, ${user.name}!`
    action = (
      <Button className="w-full" onClick={onDone}>
        Continue
      </Button>
    )
  } else if (ownLink) {
    message = 'This is your own gift link. Send it to a friend instead.'
    action = (
      <Button className="w-full" onClick={onDone}>
        Continue
      </Button>
    )
  } else if (!user) {
    message = 'Log in to accept it.'
    action = (
      <Button className="w-full" onClick={() => push(<LoginPage />)}>
        Log in
      </Button>
    )
  } else {
    message = 'Accept it to get the flashy banner.'
    action = (
      <Button className="w-full" onClick={accept} disabled={busy}>
        {busy ? '...' : 'Accept'}
      </Button>
    )
  }

  return (
    <Container
      scroll={false}
      body={
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <Pigeon className="size-32" />
          <h1 className="text-4xl">
            {accepted ? 'Gift accepted!' : (
              <>
                <span className="text-brand-blue">{from}</span> gifted you a premium membership!
              </>
            )}
          </h1>
          {!accepted && <p className="text-gray-dark">{GIFT_DAYS} days of premium access to right/left lessons.</p>}
          {accepted && user && <PremiumBanner user={user} />}
          <div className="w-full">{action}</div>
        </div>
      }
    />
  )
}
