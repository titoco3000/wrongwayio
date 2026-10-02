import { createContext, useCallback, useEffect, useContext, useMemo, useState, type ReactNode } from 'react'

type Entry = { id: number; page: ReactNode; leftAt?: number }

const EXIT_MS = 300

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

  // mark entries as leaving so they animate out, then drop them once the animation is over
  const leave = useCallback((all: boolean) => {
    const now = Date.now()
    setEntries((e) => {
      if (all) return e.map((x) => (x.leftAt ? x : { ...x, leftAt: now }))
      const i = e.findLastIndex((x) => !x.leftAt)
      return i < 0 ? e : e.map((x, j) => (j === i ? { ...x, leftAt: now } : x))
    })
    setTimeout(() => setEntries((e) => e.filter((x) => !x.leftAt || Date.now() - x.leftAt < EXIT_MS)), EXIT_MS)
  }, [])
  const pop = useCallback(() => leave(false), [leave])
  const close = useCallback(() => leave(true), [leave])
  const api = useMemo(() => ({ push, pop, close }), [push, pop, close])

  const top = entries.findLast((x) => !x.leftAt)

  useEffect(() => {
    if (entries.length === 0) onEmpty?.()
  }, [entries.length, onEmpty])

  return (
    <StackContext.Provider value={api}>
      {entries.length > 0
        ? entries.map((e) => (
            // lower and leaving pages stay mounted; inert keeps them out of focus/clicks
            <div key={e.id} className={`fixed inset-0 ${e.leftAt ? 'slide-out' : 'slide-in'}`} inert={e !== top}>
              {e.page}
            </div>
          ))
        : empty}
    </StackContext.Provider>
  )
}
