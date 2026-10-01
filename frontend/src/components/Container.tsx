import type { ReactNode } from 'react'

type Props = {
  header?: ReactNode
  body: ReactNode
  footer?: ReactNode
}

const inner = 'mx-auto w-full max-w-xl'

/**
 * Covers the whole viewport (fixed), so a container rendered inside another
 * one hides it entirely. Header/footer stay visible, body scrolls.
 */
export default function Container({ header, body, footer }: Props) {
  return (
    <div className="slide-in fixed inset-0 flex flex-col bg-paper text-ink">
      {header && (
        <header className="shrink-0 border-b-2 border-gray-soft">
          <div className={inner}>{header}</div>
        </header>
      )}
      <main className="min-h-0 flex-1 overflow-auto">
        <div className={inner}>{body}</div>
      </main>
      {footer && (
        <footer className="shrink-0 border-t-2 border-gray-soft">
          <div className={inner}>{footer}</div>
        </footer>
      )}
    </div>
  )
}
