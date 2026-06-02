import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { generateShoppingList, formatQuantity } from '../../utils/shoppingListGenerator'
import { printShoppingList } from '../../utils/printShoppingList'
import SavedShoppingLists from './SavedShoppingLists'

export default function ShoppingList() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const weekPlan = useStore(s => s.weekPlan)
  const recipes = useStore(s => s.recipes)
  const familySize = useStore(s => s.familySize)
  const checkedItems = useStore(s => s.checkedItems)
  const toggleCheckedItem = useStore(s => s.toggleCheckedItem)
  const clearCheckedItems = useStore(s => s.clearCheckedItems)
  const pruneCheckedItems = useStore(s => s.pruneCheckedItems)
  const saveShoppingList = useStore(s => s.saveShoppingList)

  const [showChecked, setShowChecked] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSavedLists, setShowSavedLists] = useState(false)
  const [listName, setListName] = useState('')
  const [saveToast, setSaveToast] = useState(null)

  const groups = generateShoppingList(weekPlan, recipes, familySize, currentLang)
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0)

  // Set of ids currently in the shopping list. Used for both display
  // counting and for pruning the persisted checkedItems map below.
  // Memoised on a stable key so we don't re-prune on every render.
  const currentIdsKey = useMemo(
    () => groups.flatMap(g => g.items.map(i => i.id)).sort().join('|'),
    [groups]
  )

  // Auto-prune: whenever the active list changes, drop any checked
  // entries that no longer correspond to a visible item. Without this,
  // changing the weekplan leaves stale check marks behind and the
  // "X of Y checked" counter goes nonsensical (32 of 7, etc.).
  useEffect(() => {
    const validIds = new Set(currentIdsKey ? currentIdsKey.split('|') : [])
    pruneCheckedItems(validIds)
  }, [currentIdsKey, pruneCheckedItems])

  // Count ONLY the items in the active list (defensive — even if the
  // prune effect lags one tick, the displayed number is honest).
  const checkedCount = groups.reduce(
    (n, g) => n + g.items.reduce((m, item) => m + (checkedItems[item.id] ? 1 : 0), 0),
    0
  )

  function handleSaveList() {
    const name = listName.trim()
    if (!name) return
    saveShoppingList(name, groups)
    setListName('')
    setShowSaveModal(false)
    setSaveToast(t('shopping.listSaved'))
    setTimeout(() => setSaveToast(null), 3000)
  }

  function handlePrint() {
    // Aisle category labels (e.g. "Produce") are stored in English on the
    // shopping list groups; translate them via i18n for the printout.
    const printGroups = groups.map(({ category, items }) => ({
      category: t(`aisles.${category}`, { defaultValue: category }),
      items: items.map((it) => ({
        name: it.name,
        quantityLabel: formatQuantity(it.quantity, it.unit),
      })),
    }))

    // Unique list of recipe titles that contributed to this list.
    const recipeTitles = [...new Set(
      Object.values(weekPlan).flatMap(day =>
        Object.values(day).flatMap(items =>
          (items || []).map(it => typeof it === 'string' ? it : it?.recipeId).filter(Boolean)
        )
      )
    )].map(rid => {
      const recipe = recipes.find(r => r.id === rid)
      if (!recipe) return null
      return recipe.translations?.[currentLang]?.title || recipe.title
    }).filter(Boolean)

    printShoppingList({
      title: t('shopping.title'),
      groups: printGroups,
      familySize,
      recipeTitles,
      labels: {
        forPeople: t('shopping.printForPeople', { defaultValue: 'For' }),
        fromRecipes: t('shopping.fromRecipes'),
        printedOn: t('recipeDetail.printedOn', { defaultValue: 'Printed' }),
        totalItems: t('shopping.printItems', { defaultValue: 'items' }),
        people: t('settings.people'),
      },
    })
  }

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('shopping.noItemsYet')}</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          {t('shopping.noItemsDesc')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header stats */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500 truncate">
              {t('shopping.checkedOf', { checked: checkedCount, total: totalItems, people: familySize })}
            </p>
            {/* Progress bar */}
            <div className="mt-1.5 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="btn-secondary py-1.5 px-2.5 text-xs"
              title={t('shopping.print', { defaultValue: 'Print' })}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
              <span className="hidden sm:inline">{t('shopping.print', { defaultValue: 'Print' })}</span>
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn-secondary py-1.5 px-2.5 text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
              <span className="hidden sm:inline">{t('shopping.saveList')}</span>
            </button>
            <button
              onClick={() => setShowSavedLists(true)}
              className="btn-ghost py-1.5 px-2 text-xs"
            >
              {t('shopping.savedLists')}
            </button>
            <button
              onClick={() => setShowChecked(s => !s)}
              className="btn-ghost text-xs py-1.5 px-2"
            >
              {showChecked ? t('shopping.hideChecked') : t('shopping.showChecked')}
            </button>
            {checkedCount > 0 && (
              <button onClick={clearCheckedItems} className="btn-ghost text-xs py-1.5 px-2 text-red-400 hover:text-red-600">
                {t('shopping.clearAll')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 lg:pb-8 space-y-4">
        {groups.map(({ category, items }) => {
          const visibleItems = showChecked ? items : items.filter(item => !checkedItems[item.id])
          if (visibleItems.length === 0) return null

          return (
            <div key={category}>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                {t(`aisles.${category}`, { defaultValue: category })}
              </h3>
              <div className="card divide-y divide-slate-50">
                {visibleItems.map(item => {
                  const isChecked = Boolean(checkedItems[item.id])
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'opacity-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheckedItem(item.id)}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`flex-1 text-sm text-slate-700 ${isChecked ? 'line-through' : ''}`}>
                        {item.name}
                      </span>
                      <span className={`text-sm font-medium ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {formatQuantity(item.quantity, item.unit)}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Recipe source summary */}
        <div className="card p-4 mt-2 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('shopping.fromRecipes')}</p>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set(
              Object.values(weekPlan).flatMap(day =>
                Object.values(day).flatMap(items =>
                  (items || []).map(it => typeof it === 'string' ? it : it?.recipeId).filter(Boolean)
                )
              )
            )].map(rid => {
              const recipe = recipes.find(r => r.id === rid)
              if (!recipe) return null
              return (
                <span key={rid} className="badge bg-indigo-50 text-indigo-700 text-xs">
                  {recipe.translations?.[currentLang]?.title || recipe.title}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Save list modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
          <div className="relative z-10 bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl p-5">
            <div className="sm:hidden flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-4">{t('shopping.saveListTitle')}</h2>
            <div className="mb-4">
              <label className="label">{t('shopping.listName')}</label>
              <input
                className="input"
                placeholder={t('shopping.listNamePlaceholder')}
                value={listName}
                onChange={e => setListName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveList()}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSaveModal(false)} className="btn-secondary flex-1">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveList}
                disabled={!listName.trim()}
                className="btn-primary flex-1"
              >
                {t('shopping.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved lists modal */}
      {showSavedLists && <SavedShoppingLists onClose={() => setShowSavedLists(false)} />}

      {/* Toast */}
      {saveToast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {saveToast}
        </div>
      )}
    </div>
  )
}
