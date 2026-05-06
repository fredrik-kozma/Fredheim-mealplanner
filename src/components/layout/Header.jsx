import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const PAGE_TITLES = {
    '/': t('recipes.title'),
    '/planner': t('planner.title'),
    '/shopping': t('shopping.title'),
    '/settings': t('settings.title'),
    '/packs': t('packs.title'),
  }

  const title = PAGE_TITLES[location.pathname] || t('app.name')

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center gap-3 lg:hidden">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
      >
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base">
          🍽
        </div>
        <span className="font-semibold text-slate-800 text-base">{title}</span>
      </button>
    </header>
  )
}
