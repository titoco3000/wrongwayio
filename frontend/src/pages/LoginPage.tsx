import { useState } from 'react'
import { api, apiErrorMessage, cleanName, isValidName, NAME_MAX, type User } from '../api'
import { Button } from '../components/general/ButtonsRow'
import ConfirmDialog from '../components/general/ConfirmDialog'
import { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import TextField from '../components/general/TextField'
import { useSession } from '../session/SessionProvider'
import CreateAccountPage from './CreateAccountPage'
import { useI18n } from '../i18n'

/** Asks for a name. No password: the user pinky promises to be who they say. */
export default function LoginPage() {
  const { pop, push } = useStack()
  const { login } = useSession()
  const { t, rich } = useI18n()
  const [name, setName] = useState('')
  const [found, setFound] = useState<User | null>(null)
  const [offerCreate, setOfferCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookUp = async () => {
    if (!isValidName(name)) return
    setBusy(true)
    setError(null)
    try {
      const user = await api.getUser(name)
      if (user) setFound(user)
      else setOfferCreate(true)
    } catch (e) {
      setError(apiErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">{t('login.title')}</h1>}
      body={
        <div className="flex flex-1 flex-col gap-6 p-4">
          {found ? (
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-3xl">{t('login.pinky.title')}</h2>
              <p className="text-gray-dark">
                {rich('login.pinky.body', { name: <strong className="text-ink">{found.name}</strong> })}
              </p>
              <div className="flex gap-3">
                <Button variant="neutral" onClick={() => setFound(null)}>
                  {t('login.notMe')}
                </Button>
                <Button
                  onClick={() => {
                    login(found)
                    pop()
                  }}
                >
                  {t('login.promise')}
                </Button>
              </div>
            </div>
          ) : (
            <TextField label={t('login.name')} value={name} onChange={setName} onSubmit={lookUp} submitLabel={t('common.continue')} maxLength={NAME_MAX} busy={busy} />
          )}
          {error && <p role="alert" className="text-center text-brand-red-dark">{error}</p>}
          {offerCreate && (
            <ConfirmDialog
              title={t('login.nobody.title')}
              message={t('login.nobody.message', { name: cleanName(name) })}
              confirmLabel={t('account.create')}
              cancelLabel={t('common.cancel')}
              onCancel={() => setOfferCreate(false)}
              onConfirm={() => {
                // swap this page for the creation page, so the way back leads to the profile
                pop()
                push(<CreateAccountPage initialName={cleanName(name)} />)
              }}
            />
          )}
        </div>
      }
    />
  )
}
