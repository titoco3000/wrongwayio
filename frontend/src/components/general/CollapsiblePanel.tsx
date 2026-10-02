import { keySoundProps } from './keySound'
import { useId, useState, type ReactNode } from 'react'

type Props = {
  header: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}

/** Expands/contracts in a fixed 300ms, whatever the content height. */
export default function CollapsiblePanel({ header, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-gray-soft">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        {...keySoundProps(() => setOpen((o) => !o))}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-soft/60"
      >
        <span>{header}</span>
        <span aria-hidden className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {/* animating grid rows 0fr -> 1fr gives a fixed duration independent of content height */}
      <div
        id={contentId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t-2 border-gray-soft p-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
