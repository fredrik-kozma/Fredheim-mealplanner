import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import RecipeList from '../components/recipes/RecipeList'
import ExportPackModal from '../components/packs/ExportPackModal'

export default function RecipesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showExportModal, setShowExportModal] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:pt-6">
        <h1 className="text-xl font-bold text-slate-900">{t('recipes.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="btn-secondary py-2 px-3.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span className="hidden sm:inline">{t('recipes.exportAsPack')}</span>
          </button>
          <button
            onClick={() => navigate('/recipes/new')}
            className="btn-primary py-2 px-3.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">{t('recipes.addRecipe')}</span>
          </button>
        </div>
      </div>
      <RecipeList />

      {showExportModal && <ExportPackModal onClose={() => setShowExportModal(false)} />}
    </div>
  )
}
