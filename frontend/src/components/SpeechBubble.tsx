import type { ReactNode } from 'react'

type Props = {
  /** side the tail connects to */
  side: 'left' | 'right'
  children: ReactNode
}

/** Comic-book style bubble: thick outline, hard shadow, tail on one side. */
export default function SpeechBubble({ side, children }: Props) {
  return (
    <div className={`flex ${side === 'left' ? 'justify-start' : 'justify-end'}`}>
      <div className="relative max-w-[85%] rounded-3xl border-4 border-ink bg-paper px-5 py-3 shadow-[4px_4px_0_0_var(--color-ink)]">
        {children}
        <svg
          viewBox="0 0 24 28"
          aria-hidden
          className={`absolute top-full -mt-1 h-7 w-6 overflow-visible ${side === 'left' ? 'left-6' : 'right-6 -scale-x-100'}`}
        >
          <polygon points="2,0 2,26 22,0" fill="var(--color-paper)" />
          <polyline points="2,0 2,26 22,0" fill="none" stroke="var(--color-ink)" strokeWidth="4" strokeLinejoin="miter" />
        </svg>
      </div>
    </div>
  )
}
