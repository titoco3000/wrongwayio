import { useState } from 'react'
import { api, ApiError, cleanName, isValidName, NAME_MAX, NAME_MIN } from '../api'
import { Button } from '../components/general/ButtonsRow'
import { useStack } from '../components/general/PagesStack'
import Pigeon from '../components/general/Pigeon'
import StackPage from '../components/general/StackPage'
import TextField from '../components/general/TextField'
import { useSession } from '../session/SessionProvider'

type Props = {
  /** pre-fills the name field, e.g. when sent here by a login that found nobody */
  initialName?: string
}

/** Asks for a name, checks with the API that it is free, and creates the account once the user confirms. */
export default function CreateAccountPage({ initialName = '' }: Props) {
  const { pop } = useStack()
  const { login } = useSession()
  const [name, setName] = useState(initialName)
  const [step, setStep] = useState<'name' | 'confirm' | 'done'>('name')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    if (!isValidName(name)) return setError(`Names have ${NAME_MIN} to ${NAME_MAX} characters.`)
    setBusy(true)
    setError(null)
    try {
      if (await api.getUser(name)) setError(`"${cleanName(name)}" is already taken.`)
      else setStep('confirm')
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
      setError(e instanceof ApiError && e.code === 'name-taken' ? `"${cleanName(name)}" was just taken.` : 'Something went wrong.')
      setStep('name')
    } finally {
      setBusy(false)
    }
  }

  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">Create account</h1>}
      body={
        <div className="flex flex-1 flex-col gap-6 p-4">
          {step === 'name' && (
            <TextField
              label="Pick a name"
              value={name}
              onChange={(v) => {
                setName(v)
                setError(null)
              }}
              onSubmit={check}
              submitLabel="Continue"
              maxLength={NAME_MAX}
              error={error}
              busy={busy}
            />
          )}
          {step === 'confirm' && (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-gray-dark">Good news, nobody has it yet.</p>
              <h2 className="text-3xl">{cleanName(name)}</h2>
              <p>Create the account with this name?</p>
              <div className="flex gap-3">
                <Button variant="neutral" onClick={() => setStep('name')} disabled={busy}>
                  Change
                </Button>
                <Button onClick={create} disabled={busy}>
                  {busy ? '...' : 'Create account'}
                </Button>
              </div>
            </div>
          )}
          {step === 'done' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
              <Pigeon className="size-32" />
              <h2 className="text-4xl text-brand-blue">Your account is officially created!</h2>
              <p className="text-gray-dark">Welcome, {cleanName(name)}.</p>
              <Button className="w-full flex-none!" onClick={pop}>
                Continue
              </Button>
            </div>
          )}
        </div>
      }
    />
  )
}
