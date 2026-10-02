import { Button } from '../components/general/ButtonsRow'
import { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import ThemeToggle from '../components/general/ThemeToggle'
import PremiumBanner from '../components/profile/PremiumBanner'
import { useSession } from '../session/SessionProvider'
import CreateAccountPage from './CreateAccountPage'
import GiftPremiumPage from './GiftPremiumPage'
import LoginPage from './LoginPage'

export default function ProfilePage() {
  const { push } = useStack()
  const { user, loading, logout } = useSession()
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">Profile</h1>}
      body={
        <div className="flex flex-col gap-8 p-4">
          <section className="flex flex-col gap-4">
            <h2 className="text-3xl">{loading ? '...' : (user?.name ?? 'Guest')}</h2>
            {user && <PremiumBanner user={user} />}
            {!loading && !user && (
              <>
                <p className="text-gray-dark">You are not logged in.</p>
                <Button className="w-full" onClick={() => push(<LoginPage />)}>
                  Log in
                </Button>
                <Button className="w-full" variant="neutral" onClick={() => push(<CreateAccountPage />)}>
                  Create account
                </Button>
              </>
            )}
            {user && (
              <>
                <Button className="w-full" onClick={() => push(<GiftPremiumPage />)}>
                  Buy premium for a friend
                </Button>
                <Button className="w-full" variant="neutral" onClick={logout}>
                  Log out
                </Button>
              </>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl">Settings</h2>
            <div className="flex items-center justify-between rounded-2xl border-2 border-gray-soft px-4 py-2">
              <span>Theme</span>
              <ThemeToggle />
            </div>
          </section>
        </div>
      }
    />
  )
}
