import { Button } from '../../general/ButtonsRow'
import Container from '../../general/Container'
import Pigeon from '../../general/Pigeon'

/** Position in a series of games: `completed` of `total` are done, counting the one just won. */
export type ChallengeProgress = { completed: number; total: number }

function ProgressDots({ completed, total }: ChallengeProgress) {
  const left = total - completed
  return (
    <div className="flex flex-col items-center gap-2" aria-label={`${completed} of ${total} games done`}>
      <div className="flex gap-2">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`size-4 rounded-full border-2 ${i < completed ? 'border-brand-blue-dark bg-brand-blue' : 'border-gray-mid'}`} />
        ))}
      </div>
      <p className="text-gray-dark">
        {completed}/{total}
      </p>
    </div>
  )
}

type Props = {
  won: boolean
  onContinue: () => void
  /** overrides the default title */
  title?: string
  /** shown when won, if the game is part of a series */
  progress?: ChallengeProgress
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
export default function ResultScreen({ won, onContinue, title, progress }: Props) {
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
          {won && progress && (
            <div style={delay} className="fade-in">
              <ProgressDots {...progress} />
            </div>
          )}
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
