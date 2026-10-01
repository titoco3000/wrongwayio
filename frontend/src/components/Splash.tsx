import { useEffect, useState, type ReactNode } from 'react'
import Pigeon from './Pigeon'

type Phase = 'show' | 'fade' | 'done'

export default function Splash({ children, duration = 1200 }: { children: ReactNode; duration?: number }) {
  const [phase, setPhase] = useState<Phase>('show')

  useEffect(() => {
    const fade = setTimeout(() => setPhase('fade'), duration)
    const done = setTimeout(() => setPhase('done'), duration + 500)
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
  }, [duration])

  return (
    <>
      {children}
      {phase !== 'done' && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#111827] transition-opacity duration-500 ${
            phase === 'fade' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Pigeon className="size-32 animate-pulse" />
          <span className="text-3xl text-white">WrongWayio</span>
        </div>
      )}
    </>
  )
}
