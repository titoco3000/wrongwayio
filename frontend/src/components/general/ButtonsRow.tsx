import { keySoundProps } from './keySound'
import { createContext, useContext, type ButtonHTMLAttributes, type ReactNode } from 'react'

const RowContext = createContext<((value: string) => void) | null>(null)

export function ButtonsRow({ onSubmit, children }: { onSubmit: (value: string) => void; children: ReactNode }) {
  return (
    <RowContext.Provider value={onSubmit}>
      <div className="flex flex-wrap gap-3">{children}</div>
    </RowContext.Provider>
  )
}

type Variant = 'primary' | 'danger' | 'neutral'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-blue border-brand-blue-dark text-outline',
  danger: 'bg-brand-red border-brand-red-dark text-outline',
  neutral: 'bg-paper border-gray-mid text-ink',
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> & {
  /** passed to the parent ButtonsRow's onSubmit */
  value?: string
  variant?: Variant
}

export function Button({ value, variant = 'primary', className = '', onClick, children, ...rest }: Props) {
  const onSubmit = useContext(RowContext)
  return (
    <button
      type="button"
      {...rest}
      {...keySoundProps((e) => {
        onClick?.(e)
        if (value !== undefined) onSubmit?.(value)
      })}
      className={`min-w-24 flex-1 cursor-pointer rounded-2xl border-2 border-b-4 px-5 py-3 uppercase tracking-wide transition active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
