import { GIFT_DAYS } from '../api'
import { Button } from '../components/general/ButtonsRow'
import CopyField from '../components/general/CopyField'
import { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import { giftLink, useSession } from '../session/SessionProvider'
import { useI18n } from '../i18n'

/** Shows the link to send to the friend. It names the buyer, so the pass knows where it came from. */
export default function GiftLinkPage() {
  const { pop } = useStack()
  const { user } = useSession()
  const { t } = useI18n()
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">{t('gift.link.title')}</h1>}
      body={
        <div className="flex flex-col gap-6 p-4">
          <h2 className="text-3xl">{t('gift.link.heading')}</h2>
          <p className="text-gray-dark">
            {t('gift.link.body', { days: GIFT_DAYS })}
          </p>
          <p className="text-gray-dark">{t('gift.link.joke')}</p>
          {user && <CopyField label={t('gift.link.field')} value={giftLink(user.name)} />}
          <Button
            className="w-full"
            variant="neutral"
            onClick={() => {
              // back to the profile, skipping the perks page
              pop()
              pop()
            }}
          >
            {t('common.done')}
          </Button>
        </div>
      }
    />
  )
}
