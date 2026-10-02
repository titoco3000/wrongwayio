import { GIFT_DAYS } from '../api'
import { Button } from '../components/general/ButtonsRow'
import CopyField from '../components/general/CopyField'
import { useStack } from '../components/general/PagesStack'
import StackPage from '../components/general/StackPage'
import { giftLink, useSession } from '../session/SessionProvider'

/** Shows the link to send to the friend. It names the buyer, so the pass knows where it came from. */
export default function GiftLinkPage() {
  const { pop } = useStack()
  const { user } = useSession()
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">Send the gift</h1>}
      body={
        <div className="flex flex-col gap-6 p-4">
          <h2 className="text-3xl">Your friend is lucky!</h2>
          <p className="text-gray-dark">
            Send them this link. When they open it, log in and accept, they get {GIFT_DAYS} days of premium, with a note that it came from you.
          </p>
          <p className="text-gray-dark">Actually, it is free. But they will be peer pressured to partake in the lessons.</p>
          {user && <CopyField label="Gift link" value={giftLink(user.name)} />}
          <Button
            className="w-full"
            variant="neutral"
            onClick={() => {
              // back to the profile, skipping the perks page
              pop()
              pop()
            }}
          >
            Done
          </Button>
        </div>
      }
    />
  )
}
