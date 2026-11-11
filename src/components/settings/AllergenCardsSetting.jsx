import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

/** The only place the kitchen cards can be turned on. Off by default. */
export default function AllergenCardsSetting() {
  const { t } = useTranslation()
  const enabled = useStore((s) => s.allergenCardsEnabled)
  const setEnabled = useStore((s) => s.setAllergenCardsEnabled)

  return (
    <div className="card p-5 mb-4">
      <h2 className="section-title mb-2">{t('allergenCards.settingsTitle')}</h2>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">{t('allergenCards.settingsBody')}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-800" id="allergen-cards-label">
          {t('allergenCards.toggle')}
        </span>
        <button
          type="button"
          role="switch"
          id="allergen-cards-toggle"
          data-testid="allergen-cards-toggle"
          aria-labelledby="allergen-cards-label"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-[#22B24C]' : 'bg-slate-300'}`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`}
          />
        </button>
      </div>
      {enabled && (
        <Link to="/allergen-cards" className="btn-secondary btn-sm mt-4">
          {t('allergenCards.open')}
        </Link>
      )}
    </div>
  )
}
