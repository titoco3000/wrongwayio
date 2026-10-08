import { keySoundProps } from '../general/keySound'
import { useStack } from '../general/PagesStack'
import ProfilePage from '../../pages/ProfilePage'
import { useSession } from '../../session/SessionProvider'
import { hasPremium } from './PremiumBanner'
import { useI18n } from '../../i18n'

/** Round user icon that opens the profile page. */
export default function ProfileButton() {
  const { push } = useStack()
  const { user } = useSession()
  const { t } = useI18n()
  const premium = !!user && hasPremium(user)
  return (
    <button
      type="button"
      aria-label={t('profile.title')}
      {...keySoundProps(() => push(<ProfilePage />))}
      className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl ${
        premium
          ? 'premium-banner relative overflow-hidden border-2 border-ink text-white shadow-[2px_2px_0_0_var(--color-ink)]'
          : 'text-gray-dark hover:bg-gray-soft'
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
    </button>
  )
}
