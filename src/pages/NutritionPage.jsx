import { useTranslation } from 'react-i18next'
import NutritionTracker from '../components/nutrition/NutritionTracker'
import { useAccess } from '../hooks/useAccess'
import LockedOverlay from '../components/subscription/LockedOverlay'

export default function NutritionPage() {
  const { t } = useTranslation()
  const { isLocked } = useAccess()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 lg:pt-6 pb-1">
        <h1 className="text-xl font-bold text-slate-900">{t('nutritionTracker.title', { defaultValue: 'Nutrition' })}</h1>
      </div>

      <div className="relative flex-1 overflow-y-auto">
        <div className={isLocked ? 'pointer-events-none' : ''}>
          <NutritionTracker />
        </div>
        {isLocked && (
          <LockedOverlay
            icon="🥗"
            title={t('preview.nutritionLockedTitle', { defaultValue: 'Track your nutrition' })}
            description={t('preview.nutritionLockedDesc', { defaultValue: 'Log what you eat and see how your week balances out. Start your free trial to use the nutrition tracker.' })}
          />
        )}
      </div>
    </div>
  )
}
