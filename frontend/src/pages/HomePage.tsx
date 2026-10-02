import { Button } from '../components/general/ButtonsRow'
import Container from '../components/general/Container'
import { useStack } from '../components/general/PagesStack'
import Pigeon from '../components/general/Pigeon'
import SpeechBubble from '../components/games/components/SpeechBubble'
import ThemeToggle from '../components/general/ThemeToggle'
import DemoPage from './DemoPage'
import GamePage from './GamePage'

export default function HomePage() {
  const { push } = useStack()
  return (
    <Container
      header={
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xl">WrongWayio</span>
          <ThemeToggle />
        </div>
      }
      body={
        <div className="flex flex-col items-center gap-6 p-6 pt-16 text-center">
          <SpeechBubble side="right">Which way is left again?</SpeechBubble>
          <Pigeon className="size-40" />
          <h1 className="text-4xl">WrongWayio</h1>
          <p className="text-gray-dark">Learn your left from your right. Eventually.</p>
        </div>
      }
      footer={
        <div className="flex flex-col gap-3 p-4">
          <Button className="w-full" onClick={() => push(<GamePage />)}>
            Game
          </Button>
          <Button className="w-full" variant="neutral" onClick={() => push(<DemoPage />)}>
            Component demo
          </Button>
        </div>
      }
    />
  )
}
