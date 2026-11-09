import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import NativePaywall from './NativePaywall'

/** Bottom sheet with the Google Play paywall — Android app only. */
export default function NativePaywallModal({ onClose }) {
  const { t } = useTranslation()
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 scrim" onClick={onClose} />
      <div className="relative z-10 sheet sm:max-w-sm overflow-hidden">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>
        <div className="flex flex-col items-center pt-5 pb-2 px-6 text-center">
          <div className="w-12 h-12 rounded-card bg-primary-100 flex items-center justify-center text-2xl mb-3">
            🍽
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t('subscription.nativePremiumTitle')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('subscription.nativePremiumDesc')}</p>
        </div>
        <div className="px-6 py-5">
          <NativePaywall onAccessGranted={onClose} />
        </div>
        <button
          onClick={onClose}
          className="tap-target absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label={t('common.close')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  )
}
