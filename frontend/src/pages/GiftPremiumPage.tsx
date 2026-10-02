import { useState } from 'react'
import { GIFT_DAYS } from '../api'
import { Button } from '../components/general/ButtonsRow'
import ConfirmDialog from '../components/general/ConfirmDialog'
import { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import GiftLinkPage from './GiftLinkPage'

const PERKS = [
  'A flashy banner under their name',
  'Bragging rights',
  'Honor',
  'Glory',
  'The quiet satisfaction of knowing their left from their right. Eventually.',
]

/** Sells the premium pass: lists the perks and asks the buyer to confirm the friend deserves it. */
export default function GiftPremiumPage() {
  const { push } = useStack()
  const [confirming, setConfirming] = useState(false)
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">Premium pass</h1>}
      body={
        <div className="flex flex-col gap-6 p-4">
          <div className="premium-banner relative overflow-hidden rounded-2xl border-4 border-ink px-5 py-4 text-center shadow-[4px_4px_0_0_var(--color-ink)]">
            <p className="text-3xl tracking-widest text-white [text-shadow:0_2px_0_rgba(0,0,0,0.4)]">★ PREMIUM ★</p>
            <p className="text-white/90 [text-shadow:0_1px_0_rgba(0,0,0,0.4)]">{GIFT_DAYS} days, for a friend</p>
          </div>
          <ul className="flex flex-col gap-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex gap-3">
                <span aria-hidden className="text-brand-blue">
                  ★
                </span>
                {perk}
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={() => setConfirming(true)}>
            My friend deserves it
          </Button>
          {confirming && (
            <ConfirmDialog
              title="Are you sure?"
              message="Does your friend really deserve this expensive gift?"
              confirmLabel="They do"
              cancelLabel="Let me think"
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
