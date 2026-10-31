import { useTranslation } from 'react-i18next'
import ShoppingList from '../components/shopping/ShoppingList'
import { useAccess } from '../hooks/useAccess'
import LockedOverlay from '../components/subscription/LockedOverlay'
import PageHeader from '../components/common/PageHeader'

export default function ShoppingPage() {
  const { t } = useTranslation()
  const { isLocked } = useAccess()

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('shopping.title')} />

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
