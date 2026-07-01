import { useTranslation } from 'react-i18next'
import { PremiumBadge } from './PremiumBadge'

type Feature = { icon: string; title: string; desc: string }

export function About() {
  const { t } = useTranslation()
  const features = t('about.features', { returnObjects: true }) as Feature[]
  const premium = t('about.premium_features', { returnObjects: true }) as Feature[]

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <section className="text-center">
        <div className="text-5xl mb-3">🎬</div>
        <h1 className="text-2xl font-bold text-white mb-3">{t('about.title')}</h1>
        <p className="text-gray-300 leading-relaxed max-w-xl mx-auto">{t('about.intro')}</p>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-lg font-bold text-gray-100 mb-4">{t('about.features_title')}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0 leading-none">{f.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-100">{f.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Premium */}
      <section className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <PremiumBadge />
          <h2 className="text-lg font-bold text-gray-100">{t('about.premium_title')}</h2>
        </div>
        <p className="text-gray-300 leading-relaxed mb-4">{t('about.premium_intro')}</p>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 text-sm text-green-200 leading-relaxed">
          🎁 {t('about.early_access')}
        </div>
        <div className="space-y-3">
          {premium.map((f, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-xl flex-shrink-0 leading-none">{f.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-100">{f.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-300/80 mt-4">{t('about.premium_note')}</p>
      </section>
    </main>
  )
}
