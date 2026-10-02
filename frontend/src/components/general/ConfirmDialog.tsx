import { Button } from './ButtonsRow'

type Props = {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Centered modal asking the user to confirm or cancel. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Yes', cancelLabel = 'No', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border-2 border-gray-mid bg-paper p-6 text-center text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl">{title}</h2>
        {message && <p className="text-gray-dark">{message}</p>}
        <div className="flex gap-3">
          <Button variant="neutral" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
