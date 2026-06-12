import { Link } from 'react-router-dom'

type Props = {
  icon: string
  title: string
  subtitle?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}

// Friendly empty-state block: big icon, title, hint and an optional CTA.
export function EmptyState({ icon, title, subtitle, actionLabel, actionTo, onAction }: Props) {
  return (
    <div className="text-center py-14">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-gray-200 font-medium mb-1">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto leading-relaxed">{subtitle}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          onClick={onAction}
          className="inline-block px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
