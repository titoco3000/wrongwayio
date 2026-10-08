import { useEffect } from 'react'
import { Button } from '../../general/ButtonsRow'
import Container from '../../general/Container'
import { useStack } from '../../general/PagesStack'
import Pigeon from '../../general/Pigeon'
import LoginPage from '../../../pages/LoginPage'
import { useSession } from '../../../session/SessionProvider'
import { useI18n } from '../../../i18n'

type Props = {
  /** what logging in would register */
  reason: 'daily' | 'record'
  /** leaving the screen, whether or not the player logged in */
  onContinue: () => void
}

/** Shown to a guest after a win or a record, offering to log in so it counts. Moves on by itself once logged in. */
export default function LoginPromptScreen({ reason, onContinue }: Props) {
  const { push } = useStack()
  const { user } = useSession()
  const { t } = useI18n()
  useEffect(() => {
    if (user) onContinue()
  }, [user, onContinue])
  return (
    <Container
      body={
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <Pigeon className="size-32" />
          <h1 className="text-3xl">{t(`login.prompt.${reason}`)}</h1>
          <div className="flex w-full flex-col gap-3">
            <Button className="w-full" onClick={() => push(<LoginPage />)}>
              {t('login.title')}
            </Button>
            <Button className="w-full" variant="neutral" onClick={onContinue}>
              {t('login.notNow')}
            </Button>
          </div>
        </div>
      }
    />
  )
}
