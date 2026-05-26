import { useTranslation } from 'react-i18next'

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px' }}>
      <button
        onClick={() => changeLanguage('en')}
        style={{
          background: 'none',
          border: 'none',
          color: i18n.language === 'en' ? '#60a5fa' : '#6b7280',
          cursor: 'pointer',
          fontWeight: i18n.language === 'en' ? 'bold' : 'normal',
          fontSize: '12px',
          padding: '2px 6px',
        }}
      >
        EN
      </button>
      <span style={{ color: '#475569', fontSize: '12px' }}>|</span>
      <button
        onClick={() => changeLanguage('ru')}
        style={{
          background: 'none',
          border: 'none',
          color: i18n.language === 'ru' ? '#60a5fa' : '#6b7280',
          cursor: 'pointer',
          fontWeight: i18n.language === 'ru' ? 'bold' : 'normal',
          fontSize: '12px',
          padding: '2px 6px',
        }}
      >
        RU
      </button>
    </div>
  )
}