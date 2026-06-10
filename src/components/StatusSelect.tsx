import { useTranslation } from 'react-i18next'
import { STATUS_OPTIONS, getStatusColor, type MediaStatus } from '../lib/status'

type Props = {
  value: string
  onStatus: (status: MediaStatus) => void
  className?: string
  /** Text of the disabled placeholder option. Defaults to "+ Add". */
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
}

// Shared status <select>. Background color is derived from the current value;
// callers pass their own className for sizing. Stops click propagation so it
// works inside clickable cards.
export function StatusSelect({ value, onStatus, className, placeholder, disabled, style }: Props) {
  const { t } = useTranslation()
  return (
    <select
      value={value || ''}
      onChange={e => { if (e.target.value) onStatus(e.target.value as MediaStatus) }}
      onClick={e => e.stopPropagation()}
      disabled={disabled}
      className={className}
      style={{ backgroundColor: getStatusColor(value), ...style }}
    >
      <option value="" disabled>{placeholder ?? `+ ${t('common.add')}`}</option>
      {STATUS_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.icon} {t(`status.${o.value}`)}</option>
      ))}
    </select>
  )
}
