import { useId, type FormEvent } from 'react'
import { Button } from './ButtonsRow'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  /** called on Enter or on pressing the button */
  onSubmit: () => void
  submitLabel: string
  maxLength?: number
  error?: string | null
  /** disables the field and button, e.g. while waiting for the API */
  busy?: boolean
  placeholder?: string
}

/** Single text input with a label, an error line and a submit button, inside a form so Enter submits. */
export default function TextField({ label, value, onChange, onSubmit, submitLabel, maxLength, error, busy, placeholder }: Props) {
  const id = useId()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!busy) onSubmit()
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor={id} className="text-gray-dark">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={busy}
        autoComplete="off"
        autoFocus
        aria-invalid={!!error}
        className="rounded-2xl border-2 border-gray-mid bg-paper px-4 py-3 text-xl text-ink outline-none focus:border-brand-blue disabled:opacity-50"
      />
      <p role="alert" className="min-h-6 text-brand-red">
        {error}
      </p>
      <Button type="submit" className="w-full" disabled={busy || !value.trim()}>
        {busy ? '...' : submitLabel}
      </Button>
    </form>
  )
}
