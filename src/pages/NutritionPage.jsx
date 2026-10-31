import { useTranslation } from 'react-i18next'
import NutritionTracker from '../components/nutrition/NutritionTracker'
import { useAccess } from '../hooks/useAccess'
import LockedOverlay from '../components/subscription/LockedOverlay'
import PageHeader from '../components/common/PageHeader'

export default function NutritionPage() {
  const { t } = useTranslation()
  const { isLocked } = useAccess()

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('nutritionTracker.title', { defaultValue: 'Nutrition' })} />

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
