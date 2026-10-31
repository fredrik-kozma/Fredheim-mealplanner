import { useTranslation } from 'react-i18next'
import WeeklyPlanner from '../components/planner/WeeklyPlanner'
import { useAccess } from '../hooks/useAccess'
import LockedOverlay from '../components/subscription/LockedOverlay'
import PageHeader from '../components/common/PageHeader'

export default function PlannerPage() {
  const { t } = useTranslation()
  const { isLocked } = useAccess()

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('planner.title')} />

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
