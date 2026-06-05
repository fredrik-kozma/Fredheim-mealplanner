import { useTranslation } from 'react-i18next'

/**
 * Step-by-step modal that walks an iOS Safari user through the
 * Add-to-Home-Screen flow. Used by both the install banner and the
 * Settings install card — kept here so the same instructions are
 * shown wherever the user might tap "Install" on iOS.
 */
export default function IOSInstallInstructions({ onClose }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
        <button
          onClick={onClose}
          aria-label={t('common.close', { defaultValue: 'Close' })}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <img src="/fredheim-logo.svg" alt="" className="w-14 h-14 rounded-full mx-auto mb-3 object-cover" />
        <h2 className="text-lg font-bold text-slate-900 text-center mb-1">
          {t('install.iosTitle', { defaultValue: 'Add to Home Screen' })}
        </h2>
        <p className="text-sm text-slate-600 text-center mb-5">
          {t('install.iosIntro', { defaultValue: 'Install Fredheim Meal Planner on your iPhone or iPad in three steps:' })}
        </p>
        <ol className="space-y-3">
          {[1, 2, 3].map(n => (
            <li key={n} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {n}
              </span>
              <span className="text-sm text-slate-700 leading-relaxed">
                {t(`install.iosStep${n}`)}
              </span>
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-xl py-2.5 text-sm transition-colors"
        >
          {t('install.iosDone', { defaultValue: 'Got it' })}
        </button>
      </div>
    </div>
  )
}
