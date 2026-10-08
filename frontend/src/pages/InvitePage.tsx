import { useState } from 'react'
import { api, apiErrorMessage, GIFT_DAYS } from '../api'
import { Button } from '../components/general/ButtonsRow'
import Container from '../components/general/Container'
import { useStack } from '../components/general/PagesStack'
import Pigeon from '../components/general/Pigeon'
import PremiumBanner from '../components/profile/PremiumBanner'
import { useSession } from '../session/SessionProvider'
import LoginPage from './LoginPage'
import { useI18n } from '../i18n'

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
  const { t, rich } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const ownLink = user?.name.toLowerCase() === from.toLowerCase()

  const accept = async () => {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      update(await api.grantPremium(user.name, from, GIFT_DAYS))
      setAccepted(true)
    } catch (e) {
      setError(apiErrorMessage(e))
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
    message = t('invite.enjoy', { name: user.name })
    action = (
      <Button className="w-full" onClick={onDone}>
        {t('common.continue')}
      </Button>
    )
  } else if (ownLink) {
    message = t('invite.own')
    action = (
      <Button className="w-full" onClick={onDone}>
        {t('common.continue')}
      </Button>
    )
  } else if (!user) {
    message = t('invite.login.prompt')
    action = (
      <Button className="w-full" onClick={() => push(<LoginPage />)}>
        {t('login.title')}
      </Button>
    )
  } else {
    message = t('invite.accept.prompt')
    action = (
      <Button className="w-full" onClick={accept} disabled={busy}>
        {busy ? '...' : t('invite.accept')}
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
            {accepted ? t('invite.accepted.title') : rich('invite.title', { from: <span className="text-brand-blue">{from}</span> })}
          </h1>
          {!accepted && <p className="text-gray-dark">{t('invite.body', { days: GIFT_DAYS })}</p>}
          {accepted && user && <PremiumBanner user={user} />}
          {error && <p role="alert" className="text-brand-red-dark">{error}</p>}
          <div className="w-full">{action}</div>
        </div>
      }
    />
  )
}
