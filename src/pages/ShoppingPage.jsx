import { useTranslation } from 'react-i18next'
import ShoppingList from '../components/shopping/ShoppingList'
import { useAccess } from '../hooks/useAccess'
import LockedOverlay from '../components/subscription/LockedOverlay'

export default function ShoppingPage() {
  const { t } = useTranslation()
  const { isLocked } = useAccess()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 lg:pt-6 pb-1">
        <h1 className="text-xl font-bold text-slate-900">{t('shopping.title')}</h1>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className={isLocked ? 'pointer-events-none' : ''}>
          <ShoppingList />
        </div>
        {isLocked && (
          <LockedOverlay
            icon="🛒"
            title={t('preview.shoppingLockedTitle')}
            description={t('preview.shoppingLockedDesc')}
          />
        )}
      </div>
    </div>
  )
}
