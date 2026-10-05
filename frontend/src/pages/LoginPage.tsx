import { useState } from 'react'
import { api, apiErrorMessage, cleanName, isValidName, NAME_MAX, type User } from '../api'
import { Button } from '../components/general/ButtonsRow'
import ConfirmDialog from '../components/general/ConfirmDialog'
import { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import TextField from '../components/general/TextField'
import { useSession } from '../session/SessionProvider'
import CreateAccountPage from './CreateAccountPage'

/** Asks for a name. No password: the user pinky promises to be who they say. */
export default function LoginPage() {
  const { pop, push } = useStack()
  const { login } = useSession()
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
      header={<h1 className="text-xl">Log in</h1>}
      body={
        <div className="flex flex-1 flex-col gap-6 p-4">
          {found ? (
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-3xl">Pinky promise?</h2>
              <p className="text-gray-dark">
                We have no passwords here. We work in the honor system. Do you pinky promise that you are really{' '}
                <strong className="text-ink">{found.name}</strong>?
              </p>
              <div className="flex gap-3">
                <Button variant="neutral" onClick={() => setFound(null)}>
                  Not me
                </Button>
                <Button
                  onClick={() => {
                    login(found)
                    pop()
                  }}
                >
                  I pinky promise
                </Button>
              </div>
            </div>
          ) : (
            <TextField label="Your name" value={name} onChange={setName} onSubmit={lookUp} submitLabel="Continue" maxLength={NAME_MAX} busy={busy} />
          )}
          {error && <p role="alert" className="text-center text-brand-red-dark">{error}</p>}
          {offerCreate && (
            <ConfirmDialog
              title="Nobody has that name"
              message={`There is no account called "${cleanName(name)}". Create it?`}
              confirmLabel="Create account"
              cancelLabel="Cancel"
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
