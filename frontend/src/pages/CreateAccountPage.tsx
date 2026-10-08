import { useState } from 'react'
import { api, ApiError, apiErrorMessage, cleanName, isValidName, NAME_MAX, NAME_MIN } from '../api'
import { Button } from '../components/general/ButtonsRow'
import { useStack } from '../components/general/PagesStack'
import Pigeon from '../components/general/Pigeon'
import StackPage from '../components/general/StackPage'
import TextField from '../components/general/TextField'
import { useSession } from '../session/SessionProvider'
import { useI18n } from '../i18n'

type Props = {
  /** pre-fills the name field, e.g. when sent here by a login that found nobody */
  initialName?: string
}

/** Asks for a name, checks with the API that it is free, and creates the account once the user confirms. */
export default function CreateAccountPage({ initialName = '' }: Props) {
  const { pop } = useStack()
  const { t } = useI18n()
  const { login } = useSession()
  const [name, setName] = useState(initialName)
  const [step, setStep] = useState<'name' | 'confirm' | 'done'>('name')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!isValidName(name)) return setError(t('account.nameLength', { min: NAME_MIN, max: NAME_MAX }))
    setBusy(true)
    setError(null)
    try {
      if (await api.getUser(name)) setError(t('account.taken', { name: cleanName(name) }))
      else setStep('confirm')
    } catch (e) {
      setError(apiErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      login(await api.createUser(name))
      setStep('done')
    } catch (e) {
      // someone may have taken the name since it was checked
      setError(e instanceof ApiError && e.code === 'name-taken' ? t('account.justTaken', { name: cleanName(name) }) : apiErrorMessage(e))
      setStep('name')
    } finally {
      setBusy(false)
    }
  }

  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">{t('account.create')}</h1>}
      body={
        <div className="flex flex-1 flex-col gap-6 p-4">
          {step === 'name' && (
            <TextField
              label={t('account.pickName')}
              value={name}
              onChange={(v) => {
                setName(v)
                setError(null)
              }}
              onSubmit={check}
              submitLabel={t('common.continue')}
              maxLength={NAME_MAX}
              error={error}
              busy={busy}
            />
          )}
          {step === 'confirm' && (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-gray-dark">{t('account.goodNews')}</p>
              <h2 className="text-3xl">{cleanName(name)}</h2>
              <p>{t('account.confirm')}</p>
              <div className="flex gap-3">
                <Button variant="neutral" onClick={() => setStep('name')} disabled={busy}>
                  {t('account.change')}
                </Button>
                <Button onClick={create} disabled={busy}>
                  {busy ? '...' : t('account.create')}
                </Button>
              </div>
            </div>
          )}
          {step === 'done' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
              <Pigeon className="size-32" />
              <h2 className="text-4xl text-brand-blue">{t('account.done')}</h2>
              <p className="text-gray-dark">{t('account.welcome', { name: cleanName(name) })}</p>
              <Button className="w-full flex-none!" onClick={pop}>
                {t('common.continue')}
              </Button>
            </div>
          )}
        </div>
      }
    />
  )
}
