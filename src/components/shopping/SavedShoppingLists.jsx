import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { formatQuantity } from '../../utils/shoppingListGenerator'
import { combineQuantities } from '../../utils/ingredientMatcher'
import { printShoppingList } from '../../utils/printShoppingList'
import EditableNumber from '../common/EditableNumber'

export default function SavedShoppingLists({ onClose }) {
  const { t } = useTranslation()
  const savedShoppingLists = useStore(s => s.savedShoppingLists)
  const deleteSavedShoppingList = useStore(s => s.deleteSavedShoppingList)
  const familySize = useStore(s => s.familySize)

  // When set, we're viewing/reusing one saved list (scaled to `portions`).
  const [viewing, setViewing] = useState(null)
  const [portions, setPortions] = useState(4)

  function openList(list) {
    setViewing(list)
    setPortions(list.portions || familySize || 4)
  }

  function handleDelete(list) {
    if (confirm(t('shopping.deleteListConfirm', { name: list.name }))) {
      deleteSavedShoppingList(list.id)
      if (viewing?.id === list.id) setViewing(null)
    }
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function countItems(items) {
    if (!items) return 0
    return items.reduce((sum, g) => sum + (g.items?.length || 0), 0)
  }

  function categoryLabel(category) {
    if (category === '__custom__') return t('shopping.myItems', { defaultValue: 'My items' })
    return t(`aisles.${category}`, { defaultValue: category })
  }

  // Scale the leading number of a freeform amount string ("2 pk" -> "4 pk",
  // "1,5 l" -> "3 l") while leaving the trailing text alone. Amounts with
  // no leading number ("a bunch") are returned unchanged.
  function scaleAmountString(amount, ratio) {
    if (!amount || ratio === 1) return amount || ''
    const m = String(amount).trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)
    if (!m) return amount
    const num = parseFloat(m[1].replace(',', '.'))
    if (isNaN(num)) return amount
    const scaled = Math.round(num * ratio * 100) / 100
    const numStr = scaled % 1 === 0 ? String(scaled) : scaled.toFixed(2).replace(/\.?0+$/, '')
    return m[2] ? `${numStr} ${m[2]}` : numStr
  }

  // Re-scale a saved list's quantities from the portions it was saved for
  // to the portions the user wants now. Generated items carry per-recipe
  // `sources`, which we scale and re-combine for an exact result; custom
  // items scale the numeric part of their freeform amount.
  function scaledGroups(list, targetPortions) {
    const savedFor = list.portions || targetPortions || 1
    const ratio = savedFor ? targetPortions / savedFor : 1
    return (list.items || []).map(group => ({
      category: group.category,
      items: (group.items || []).map(item => {
        if (item.custom) return { name: item.name, label: scaleAmountString(item.quantity, ratio) }
        if (Array.isArray(item.sources) && item.sources.length > 0) {
          const scaled = item.sources.map(s => ({ ...s, quantity: (s.quantity || 0) * ratio }))
          const c = combineQuantities(scaled)
          return { name: item.name, label: formatQuantity(c.quantity, c.unit) }
        }
        if (typeof item.quantity === 'number') {
          return { name: item.name, label: formatQuantity(item.quantity * ratio, item.unit) }
        }
        return { name: item.name, label: formatQuantity(item.quantity, item.unit) }
      }),
    }))
  }

  function handlePrintViewing() {
    const groups = scaledGroups(viewing, portions).map(g => ({
      category: categoryLabel(g.category),
      items: g.items.map(it => ({ name: it.name, quantityLabel: it.label })),
    }))
    printShoppingList({
      title: viewing.name || t('shopping.title'),
      groups,
      familySize: portions,
      recipeTitles: [],
      labels: {
        forPeople: t('shopping.printForPeople', { defaultValue: 'For' }),
        fromRecipes: t('shopping.fromRecipes'),
        printedOn: t('recipeDetail.printedOn', { defaultValue: 'Printed' }),
        totalItems: t('shopping.printItems', { defaultValue: 'items' }),
        people: t('settings.people'),
      },
    })
  }

  const viewGroups = viewing ? scaledGroups(viewing, portions) : []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          {viewing ? (
            <button onClick={() => setViewing(null)} className="btn-ghost -ml-2 px-2 text-sm text-slate-600 inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('common.back', { defaultValue: 'Back' })}
            </button>
          ) : (
            <h2 className="text-base font-semibold text-slate-800">{t('shopping.savedListsTitle')}</h2>
          )}
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {!viewing ? (
          <div className="flex-1 overflow-y-auto p-5">
            {savedShoppingLists.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🛒</div>
                <p className="text-sm text-slate-500">{t('shopping.noSavedLists')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...savedShoppingLists].reverse().map(list => (
                  <div key={list.id} className="card p-4 flex items-center gap-3">
                    <button onClick={() => openList(list)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-slate-800 truncate">{list.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t('shopping.itemCount', { count: countItems(list.items) })}
                        {list.portions ? ` · ${t('shopping.forPortions', { count: list.portions, defaultValue: `for ${list.portions}` })}` : ''}
                        {' · '}{formatDate(list.savedAt)}
                      </p>
                    </button>
                    <button
                      onClick={() => openList(list)}
                      className="btn-secondary py-1.5 px-3 text-xs flex-shrink-0"
                    >
                      {t('shopping.openList', { defaultValue: 'Open' })}
                    </button>
                    <button
                      onClick={() => handleDelete(list)}
                      className="btn-ghost p-1.5 text-slate-300 hover:text-red-500 flex-shrink-0"
                      title={t('common.delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Portions scaler */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{viewing.name}</p>
                <p className="text-xs text-slate-500">
                  {t('shopping.savedForPortions', { count: viewing.portions || '—', defaultValue: `Saved for ${viewing.portions || '—'}` })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-500">{t('shopping.portions', { defaultValue: 'Portions' })}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPortions(p => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                  >−</button>
                  <EditableNumber
                    value={portions}
                    onChange={setPortions}
                    min={1}
                    className="w-10 text-center text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded py-1 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
                  />
                  <button
                    onClick={() => setPortions(p => p + 1)}
                    className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Scaled items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {viewGroups.map((group, gi) => (
                <div key={gi}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                    {categoryLabel(group.category)}
                  </h3>
                  <div className="card divide-y divide-slate-50">
                    {group.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="flex-1 min-w-0 text-sm text-slate-700 break-words">{item.name}</span>
                        <span className="text-sm font-medium text-slate-900 whitespace-nowrap">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="px-5 py-3 border-t border-slate-100">
              <button onClick={handlePrintViewing} className="btn-primary w-full py-2 text-sm inline-flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247" />
                </svg>
                {t('shopping.print', { defaultValue: 'Print' })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
