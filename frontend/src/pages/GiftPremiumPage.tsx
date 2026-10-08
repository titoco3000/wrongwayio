import { useState } from 'react'
import { GIFT_DAYS } from '../api'
import { Button } from '../components/general/ButtonsRow'
import ConfirmDialog from '../components/general/ConfirmDialog'
import { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import GiftLinkPage from './GiftLinkPage'
import { useI18n } from '../i18n'

const PERKS = ['gift.premium.perk1', 'gift.premium.perk2', 'gift.premium.perk3', 'gift.premium.perk4', 'gift.premium.perk5']

/** Sells the premium pass: lists the perks and asks the buyer to confirm the friend deserves it. */
export default function GiftPremiumPage() {
  const { push } = useStack()
  const { t } = useI18n()
  const [confirming, setConfirming] = useState(false)
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">{t('gift.premium.title')}</h1>}
      body={
        <div className="flex flex-col gap-6 p-4">
          <div className="premium-banner relative overflow-hidden rounded-2xl border-4 border-ink px-5 py-4 text-center shadow-[4px_4px_0_0_var(--color-ink)]">
            <p className="text-3xl tracking-widest text-white [text-shadow:0_2px_0_rgba(0,0,0,0.4)]">★ PREMIUM ★</p>
            <p className="text-white/90 [text-shadow:0_1px_0_rgba(0,0,0,0.4)]">{t('gift.premium.days', { days: GIFT_DAYS })}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex gap-3">
                <span aria-hidden className="text-brand-blue">
                  ★
                </span>
                {t(perk)}
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={() => setConfirming(true)}>
            {t('gift.premium.cta')}
          </Button>
          {confirming && (
            <ConfirmDialog
              title={t('gift.premium.confirm.title')}
              message={t('gift.premium.confirm.message')}
              confirmLabel={t('gift.premium.confirm.yes')}
              cancelLabel={t('gift.premium.confirm.no')}
              onCancel={() => setConfirming(false)}
              onConfirm={() => {
                setConfirming(false)
                push(<GiftLinkPage />)
              }}
            />
          )}
        </div>
      }
    />
  )
}
