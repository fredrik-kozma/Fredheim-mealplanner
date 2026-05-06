import { useTranslation } from 'react-i18next'
import ShoppingList from '../components/shopping/ShoppingList'

export default function ShoppingPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 lg:pt-6 pb-1">
        <h1 className="text-xl font-bold text-slate-900">{t('shopping.title')}</h1>
      </div>
      <ShoppingList />
    </div>
  )
}
