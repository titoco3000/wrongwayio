import { Button } from '../../general/ButtonsRow'
import Container from '../../general/Container'

type Props = {
  /** consecutive days, including today */
  streak: number
  onContinue: () => void
}

function Flame() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="star-stamp size-40">
      <path
        d="M12 2c1 4-3 6-3 10a3 3 0 0 0 1.5 2.6C10 13 11 11.5 12.5 10c1 2 3.5 3.5 3.5 6.5A4.5 4.5 0 0 1 11.5 21 6.5 6.5 0 0 1 5 14.5C5 9 11 7.5 12 2z"
        fill="#fb923c"
        stroke="#c2410c"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Full-screen streak counter, shown after the first completed daily challenge of the day. */
export default function StreakScreen({ streak, onContinue }: Props) {
  return (
    <Container
      scroll={false}
      body={
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <Flame />
          <div style={{ animationDelay: '700ms' }} className="fade-in">
            <p className="text-7xl text-brand-blue">{streak}</p>
            <h1 className="text-3xl">{streak === 1 ? 'day streak' : 'day streak!'}</h1>
            <p className="mt-2 text-gray-dark">{streak === 1 ? 'Come back tomorrow to keep it going.' : 'Keep it going tomorrow.'}</p>
          </div>
          <div style={{ animationDelay: '700ms' }} className="fade-in w-full">
            <Button className="w-full" onClick={onContinue}>
              Continue
            </Button>
          </div>
        </div>
      }
    />
  )
}
