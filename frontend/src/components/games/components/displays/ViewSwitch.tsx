import './ViewSwitch.css'
import { useI18n } from '../../../../i18n'

type Props = {
  topDown: boolean
  onChange: (topDown: boolean) => void
}

export default function ViewSwitch({ topDown, onChange }: Props) {
  const { t } = useI18n()
  return (
    <label className="view-switch">
      <input
        aria-label={t('view.topDown')}
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
