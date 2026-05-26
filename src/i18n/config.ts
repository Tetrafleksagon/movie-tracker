// src/i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en'
import ru from './ru'

// ✅ Читаем сохранённый язык из localStorage, иначе 'en'
const savedLang = typeof window !== 'undefined' 
  ? localStorage.getItem('language') 
  : null

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru }
  },
  lng: savedLang || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false }
})

// ✅ Сохраняем язык при каждом изменении
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng)
  }
})

export default i18n