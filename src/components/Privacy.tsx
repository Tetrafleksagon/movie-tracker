import { useTranslation } from 'react-i18next'

type Section = { title: string; body: string; items?: string[] }

export function Privacy() {
  const { t } = useTranslation()
  const sections = t('privacy.sections', { returnObjects: true }) as Section[]

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <section className="text-center">
        <div className="text-5xl mb-3">🔒</div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('privacy.title')}</h1>
        <p className="text-xs text-gray-500">{t('privacy.updated')}</p>
      </section>

      <p className="text-gray-300 leading-relaxed">{t('privacy.intro')}</p>

      {sections.map((s, i) => (
        <section key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-base font-bold text-gray-100 mb-2">{s.title}</h2>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{s.body}</p>
          {s.items && (
            <ul className="mt-3 space-y-1 text-sm text-gray-300">
              {s.items.map((it, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-gray-500">•</span>
                  <span className="leading-relaxed">{it}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="text-xs text-gray-500 text-center">
        {t('privacy.contact_prefix')}{' '}
        <a href="mailto:dev@filmtrack.pp.ua" className="text-blue-400 hover:text-blue-300 transition">
          dev@filmtrack.pp.ua
        </a>
      </p>
    </main>
  )
}
