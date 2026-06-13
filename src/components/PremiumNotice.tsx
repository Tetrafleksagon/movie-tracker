import { useTranslation } from 'react-i18next'

// Shown where a premium-only feature would be, for non-premium users.
export function PremiumNotice({ title, desc }: { title: string; desc: string }) {
  const { t } = useTranslation()
  return (
    <div className="text-center py-12 px-4">
      <div className="text-5xl mb-3">⭐</div>
      <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-0.5 mb-3">
        {t('premium.badge')}
      </span>
      <p className="text-gray-200 font-medium mb-1">{title}</p>
      <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">{desc}</p>
    </div>
  )
}
