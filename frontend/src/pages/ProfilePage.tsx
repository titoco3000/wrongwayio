import { Button } from '../components/general/ButtonsRow'
import { useStack } from '../components/general/PagesStack'
import { Option, Select } from '../components/general/Select'
import StackPage from '../components/general/StackPage'
import ThemeToggle from '../components/general/ThemeToggle'
import PremiumBanner from '../components/profile/PremiumBanner'
import { useSession } from '../session/SessionProvider'
import CreateAccountPage from './CreateAccountPage'
import GiftPremiumPage from './GiftPremiumPage'
import LoginPage from './LoginPage'
import { useI18n } from '../i18n'

const AUTO = 'auto'

export default function ProfilePage() {
  const { push } = useStack()
  const { user, loading, logout } = useSession()
  const { t, preference, setLanguage, languages } = useI18n()
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">{t('profile.title')}</h1>}
      body={
        <div className="flex flex-col gap-8 p-4">
          <section className="flex flex-col gap-4">
            <h2 className="text-3xl">{loading ? '...' : (user?.name ?? t('profile.guest'))}</h2>
            {user && <PremiumBanner user={user} />}
            {!loading && !user && (
              <>
                <p className="text-gray-dark">{t('profile.notLoggedIn')}</p>
                <Button className="w-full" onClick={() => push(<LoginPage />)}>
                  {t('login.title')}
                </Button>
                <Button className="w-full" variant="neutral" onClick={() => push(<CreateAccountPage />)}>
                  {t('account.create')}
                </Button>
              </>
            )}
            {user && (
              <>
                <Button className="w-full" onClick={() => push(<GiftPremiumPage />)}>
                  {t('profile.buyPremium')}
                </Button>
                <Button className="w-full" variant="neutral" onClick={logout}>
                  {t('profile.logout')}
                </Button>
              </>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl">{t('profile.settings')}</h2>
            <div className="flex items-center justify-between rounded-2xl border-2 border-gray-soft px-4 py-2">
              <span>{t('profile.theme')}</span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border-2 border-gray-soft px-4 py-3">
              <span>{t('profile.language')}</span>
              <Select defaultValue={preference ?? AUTO} onChange={(v) => setLanguage(v === AUTO ? null : v)}>
                <Option value={AUTO}>{t('language.auto')}</Option>
                {languages.map((l) => (
                  <Option key={l.code} value={l.code}>
                    {l.name}
                  </Option>
                ))}
              </Select>
            </div>
          </section>
        </div>
      }
    />
  )
}
