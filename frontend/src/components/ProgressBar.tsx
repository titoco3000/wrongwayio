type Props = {
  value: number
  max: number
}

/** Fill width animates whenever `value` changes, overshooting a bit for a bouncy feel. */
export default function ProgressBar({ value, max }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-4 w-full overflow-hidden rounded-full bg-gray-soft"
    >
      <div
        className="h-full rounded-full bg-brand-blue transition-[width] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
