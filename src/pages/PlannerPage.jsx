import { useTranslation } from 'react-i18next'
import WeeklyPlanner from '../components/planner/WeeklyPlanner'

export default function PlannerPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 lg:pt-6 pb-1">
        <h1 className="text-xl font-bold text-slate-900">{t('planner.title')}</h1>
      </div>
      <WeeklyPlanner />
    </div>
  )
}
