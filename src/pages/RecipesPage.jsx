import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import RecipeList from '../components/recipes/RecipeList'
import ExportPackModal from '../components/packs/ExportPackModal'
import PageHeader from '../components/common/PageHeader'

export default function RecipesPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showExportModal, setShowExportModal] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('recipes.title')}
        actions={<>
          <button
            onClick={() => setShowExportModal(true)}
            aria-label={t('recipes.exportAsPack')}
            className="btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span className="hidden sm:inline">{t('recipes.exportAsPack')}</span>
          </button>
          <button
            onClick={() => navigate('/recipes/new')}
            aria-label={t('recipes.addRecipe')}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">{t('recipes.addRecipe')}</span>
          </button>
        </>}
      />
      <RecipeList />

      {showExportModal && <ExportPackModal onClose={() => setShowExportModal(false)} />}
    </div>
  )
}
