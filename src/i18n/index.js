import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import no from './locales/no.json'
import sv from './locales/sv.json'

// Norwegian is the default, but English and Swedish remain available
// and can be chosen from Settings → Språk.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      no: { translation: no },
      sv: { translation: sv },
    },
    fallbackLng: 'no',
    supportedLngs: ['en', 'no', 'sv'],
    detection: {
      // Prefer the user's saved choice; otherwise default to Norwegian.
      order: ['localStorage'],
      lookupLocalStorage: 'menuPlannerLang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

// First-time visitors (no saved preference) start in Norwegian.
try {
  if (!localStorage.getItem('menuPlannerLang')) {
    localStorage.setItem('menuPlannerLang', 'no')
    i18n.changeLanguage('no')
  }
} catch (e) {
  // ignore (SSR / privacy mode)
}

export default i18n
