import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

/**
 * The first thing a new visitor sees: which language do you want?
 *
 * It replaced an onboarding tour that had drifted out of date. A tour
 * explains an app you haven't used yet, in a language you may not read;
 * this asks the one question whose answer changes every screen behind it,
 * and gets out of the way.
 *
 * Deliberately not translated. Each option is written in its own language,
 * which is the only presentation that works regardless of which one the
 * reader speaks — the whole point is that we don't know yet.
 */

const LANGUAGES = [
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

export default function LanguagePicker({ onChoose }) {
  const { i18n } = useTranslation()

  // Highlight the browser's language when we support it, so the likely
  // answer is visibly the easy one — without choosing for them.
  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase()
  const suggested = LANGUAGES.some(l => l.code === browserLang) ? browserLang : null

  function choose(code) {
    i18n.changeLanguage(code)
    // Same key Settings writes, so the choice survives a reload even
    // before the store has rehydrated.
    try { localStorage.setItem('menuPlannerLang', code) } catch { /* private mode */ }
    onChoose(code)
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 text-center">
        <img
          src="/fredheim-logo.svg"
          alt=""
          className="w-14 h-14 rounded-full object-cover mx-auto mb-4"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <h1 className="text-lg font-bold text-slate-800">Fredheim</h1>
        {/* Three languages, three scripts of the same sentence — short
            enough to stack without becoming a wall of text. */}
        <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
          Velg språk · Välj språk · Choose language
        </p>

        <div className="space-y-2">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => choose(code)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-colors text-left ${
                suggested === code
                  ? 'border-indigo-500 bg-indigo-50/60 hover:bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl leading-none" aria-hidden>{flag}</span>
              <span className="font-semibold text-slate-800">{label}</span>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 mt-4">
          Du kan endre dette senere · Du kan ändra detta senare · You can change this later
        </p>
      </div>
    </div>,
    document.body
  )
}
