import { useRef, useState } from 'react'
import { Button } from './ButtonsRow'

const FEEDBACK_MS = 1500

/** Read-only text with a button that copies it to the clipboard. */
export default function CopyField({ value, label }: { value: string; label: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    input.current?.select()
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // no clipboard access: the text is selected, so the user can copy it by hand
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), FEEDBACK_MS)
  }

  return (
    <div className="flex gap-2">
      <input
        ref={input}
        readOnly
        value={value}
        aria-label={label}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-2xl border-2 border-gray-mid bg-paper px-4 py-3 text-ink outline-none focus:border-brand-blue"
      />
      <Button onClick={copy} className="min-w-28 flex-none">
        {copied ? 'Copied!' : 'Copy'}
      </Button>
    </div>
  )
}
