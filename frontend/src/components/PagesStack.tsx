import { Fragment, createContext, useCallback, useEffect, useContext, useMemo, useState, type ReactNode } from 'react'

type Entry = { id: number; page: ReactNode }

type StackApi = {
  push: (page: ReactNode) => void
  pop: () => void
  close: () => void
}

const StackContext = createContext<StackApi | null>(null)

export function useStack(): StackApi {
  const ctx = useContext(StackContext)
  if (!ctx) throw new Error('useStack must be used inside a PagesStack')
  return ctx
}

let nextId = 0

type Props = {
  initial: ReactNode
  /** rendered when every page was removed from the stack */
  empty?: ReactNode
  /** called when the stack becomes empty */
  onEmpty?: () => void
}

/** Holds a stack of pages. All stay mounted, the top one covers the rest. */
export default function PagesStack({ initial, empty = null, onEmpty }: Props) {
  const [entries, setEntries] = useState<Entry[]>(() => [{ id: nextId++, page: initial }])

  const push = useCallback((page: ReactNode) => setEntries((e) => [...e, { id: nextId++, page }]), [])
  const pop = useCallback(() => setEntries((e) => e.slice(0, -1)), [])
  const close = useCallback(() => setEntries([]), [])
  const api = useMemo(() => ({ push, pop, close }), [push, pop, close])

  const top = entries[entries.length - 1]

  useEffect(() => {
    if (!top) onEmpty?.()
  }, [top, onEmpty])

  return (
    <StackContext.Provider value={api}>
      {top
        ? entries.map((e) => (
            <Fragment key={e.id}>
              {/* lower pages stay mounted underneath so slide-ins reveal them; inert keeps them out of focus/clicks */}
              <div className="contents" inert={e !== top}>
                {e.page}
              </div>
            </Fragment>
          ))
        : empty}
    </StackContext.Provider>
  )
}
