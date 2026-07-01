import { useTranslation } from 'react-i18next'

// Gold "★ PREMIUM" pill, shared everywhere the badge appears
// (profile, share page, share modal, upsells).
export function PremiumBadge({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-block text-[11px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded-full px-2.5 py-0.5 ${className}`}
    >
      ★ {t('premium.badge')}
    </span>
  )
}
