import { useState } from 'react'
import { Button } from '../components/ButtonsRow'
import PagesStack, { useStack } from '../components/PagesStack'
import StackPage from '../components/StackPage'
import LabeledButtonGame from '../games/LabeledButtonGame'

const LOOPS = 5

/** Closeable game page; finishing the game closes it. */
function RoundPage() {
  const { close } = useStack()
  return (
    <LabeledButtonGame
      loops={LOOPS}
      onEnd={(won) => {
        console.log(won ? 'Won' : 'Lost')
        close()
      }}
    />
  )
}

export default function GamePage() {
  const [playing, setPlaying] = useState(false)
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">Game</h1>}
      body={
        <div className="p-4">
          <Button className="w-full" onClick={() => setPlaying(true)}>
            Play round
          </Button>
          {playing && <PagesStack initial={<RoundPage />} onEmpty={() => setPlaying(false)} />}
        </div>
      }
    />
  )
}
