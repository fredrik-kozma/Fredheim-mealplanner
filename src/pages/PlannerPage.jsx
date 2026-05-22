import { useTranslation } from 'react-i18next'
import WeeklyPlanner from '../components/planner/WeeklyPlanner'
import { useAccess } from '../hooks/useAccess'
import LockedOverlay from '../components/subscription/LockedOverlay'

export default function PlannerPage() {
  const { t } = useTranslation()
  const { isLocked } = useAccess()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 lg:pt-6 pb-1">
        <h1 className="text-xl font-bold text-slate-900">{t('planner.title')}</h1>
      </div>

      {/* The planner UI is rendered behind the locked overlay so visitors
          can see the layout — they just can't interact with it. */}
      <div className="relative flex-1 overflow-hidden">
        <div className={isLocked ? 'pointer-events-none' : ''}>
          <WeeklyPlanner />
        </div>
        {isLocked && (
          <LockedOverlay
            icon="📅"
            title={t('preview.plannerLockedTitle')}
            description={t('preview.plannerLockedDesc')}
          />
        )}
      </div>
    </div>
  )
}
