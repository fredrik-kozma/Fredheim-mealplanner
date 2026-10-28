import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Shown for any address the app has no page for (the catch-all route), and
// for an edit link to a recipe that no longer exists.
export default function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
      <div className="text-4xl mb-3" aria-hidden="true">🍽️</div>
      <h1 className="text-xl font-bold text-slate-900">{t('notFound.title')}</h1>
      <p className="text-slate-500 mt-2 max-w-sm">{t('notFound.text')}</p>
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button className="btn-primary" onClick={() => navigate('/')}>{t('notFound.toRecipes')}</button>
        <button className="btn-secondary" onClick={() => navigate('/planner')}>{t('notFound.toPlanner')}</button>
      </div>
    </div>
  )
}
