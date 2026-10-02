import { keySoundProps } from './keySound'
import { createContext, useContext, useState, type ReactNode } from 'react'

type SelectApi = { selected: string | undefined; choose: (value: string) => void }

const SelectContext = createContext<SelectApi | null>(null)

type Props = {
  onChange: (value: string) => void
  defaultValue?: string
  children: ReactNode
}

export function Select({ onChange, defaultValue, children }: Props) {
  const [selected, setSelected] = useState(defaultValue)
  const choose = (value: string) => {
    setSelected(value)
    onChange(value)
  }
  return (
    <SelectContext.Provider value={{ selected, choose }}>
      <div role="radiogroup" className="flex flex-col gap-2">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function Option({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(SelectContext)
  if (!ctx) throw new Error('Option must be used inside a Select')
  const active = ctx.selected === value
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      {...keySoundProps(() => ctx.choose(value))}
      className={`cursor-pointer rounded-2xl border-2 px-4 py-3 text-left transition ${
        active ? 'border-brand-blue bg-brand-blue/10 text-brand-blue-dark' : 'border-gray-soft hover:bg-gray-soft/60'
      }`}
    >
      {children}
    </button>
  )
}
