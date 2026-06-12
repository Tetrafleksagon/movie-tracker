import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const KEY = 'mt_onboarding_dismissed'

// One-time "how it works" hint on the home page. Dismissal persists locally.
export function WelcomeTip() {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(KEY) === '1')
  if (dismissed) return null

  const close = () => {
    localStorage.setItem(KEY, '1')
    setDismissed(true)
  }

  const steps = [
    `🔍 ${t('onboarding.step_search')}`,
    `➕ ${t('onboarding.step_add')}`,
    `✅ ${t('onboarding.step_track')}`,
    `📑 ${t('onboarding.step_lists')}`,
  ]

  return (
    <div className="relative mb-8 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-indigo-700/40 rounded-xl p-4 pr-10">
      <button
        onClick={close}
        title={t('onboarding.dismiss')}
        className="absolute top-2 right-2 w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/60 transition flex items-center justify-center text-lg leading-none"
      >
        ×
      </button>
      <p className="font-semibold text-gray-100 mb-2">{t('onboarding.welcome_title')}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-300">
        {steps.map((s, i) => <span key={i}>{s}</span>)}
      </div>
    </div>
  )
}
