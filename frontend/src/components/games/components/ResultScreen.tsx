import { Button } from './ButtonsRow'
import Container from './Container'
import Pigeon from './Pigeon'

type Props = {
  won: boolean
  onContinue: () => void
  /** overrides the default title */
  title?: string
}

/** Large star that slams down from a size covering the whole screen. */
function StampStar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="star-stamp size-40">
      <path
        d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.3l7.1-.7z"
        fill="#facc15"
        stroke="#a16207"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Default full-screen victory/defeat screen shared by all games. */
export default function ResultScreen({ won, onContinue, title }: Props) {
  // content waits for the win stamp to land
  const delay = won ? { animationDelay: '1700ms' } : undefined
  return (
    <Container
      scroll={false}
      body={
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <h1 style={delay} className={`fade-in text-5xl ${won ? 'text-brand-blue' : 'text-brand-red'}`}>
            {title ?? (won ? 'You nailed it!' : 'Wrong way!')}
          </h1>
          {won ? <StampStar /> : <Pigeon className="fade-in size-32 grayscale" />}
          <div style={delay} className="fade-in w-full">
            <Button className="w-full" onClick={onContinue}>
              Continue
            </Button>
          </div>
        </div>
      }
    />
  )
}
