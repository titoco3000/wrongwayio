import './ViewSwitch.css'

type Props = {
  topDown: boolean
  onChange: (topDown: boolean) => void
}

export default function ViewSwitch({ topDown, onChange }: Props) {
  return (
    <label className="view-switch">
      <input
        aria-label="Top-down view"
        type="checkbox"
        role="switch"
        checked={topDown}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="view-switch__rail" aria-hidden="true" />
      <span className="view-switch__handle" aria-hidden="true" />
    </label>
  )
}
