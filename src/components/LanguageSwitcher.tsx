import { useTranslation } from 'react-i18next'

const LANGS = ['en', 'ru'] as const

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'ru' ? 'ru' : 'en'

  // i18n persists the choice to localStorage via its 'languageChanged' listener
  // (see i18n/config.ts), so changeLanguage is all we need here.
  const changeLanguage = (lng: string) => i18n.changeLanguage(lng)

  // Single oval segmented control.
  return (
    <div className="inline-flex items-center rounded-full bg-gray-800 border border-gray-700 p-0.5 text-xs font-medium">
      {LANGS.map(l => (
        <button
          key={l}
          onClick={() => changeLanguage(l)}
          className={`px-2.5 py-1 rounded-full transition ${
            lang === l ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
