import { PremiumBadge } from './PremiumBadge'

// Shown where a premium-only feature would be, for non-premium users.
export function PremiumNotice({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-5xl mb-3">⭐</div>
      <PremiumBadge className="mb-3" />
      <p className="text-gray-200 font-medium mb-1">{title}</p>
      <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">{desc}</p>
    </div>
  )
}
