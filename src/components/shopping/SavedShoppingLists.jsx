import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { formatQuantity } from '../../utils/formatQuantity'
import { combineQuantities } from '../../utils/ingredientMatcher'
import { nameForAmount, resolveIngredientId } from '../../utils/ingredientDictionary'
import { totalOptionsFor } from '../../utils/shoppingListGenerator'
import { buildRecipeBreakdown } from '../../utils/recipeBreakdown'
import { printShoppingList } from '../../utils/printShoppingList'
import EditableNumber from '../common/EditableNumber'

export default function SavedShoppingLists({ onClose }) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const savedShoppingLists = useStore(s => s.savedShoppingLists)
  const deleteSavedShoppingList = useStore(s => s.deleteSavedShoppingList)
  const familySize = useStore(s => s.familySize)
  const savedListChecks = useStore(s => s.savedListChecks) || {}
  const toggleSavedListItem = useStore(s => s.toggleSavedListItem)
  const clearSavedListChecks = useStore(s => s.clearSavedListChecks)

  // When set, we're viewing/reusing one saved list (scaled to `portions`).
  const [viewing, setViewing] = useState(null)
  const [portions, setPortions] = useState(4)
  // Which item's recipe breakdown is open, by item key. One at a time.
  const [openBreakdown, setOpenBreakdown] = useState(null)

  // `category::name` rather than an array index, so a tick survives the
  // list being re-scaled (which rebuilds every item object) and doesn't
  // slide onto a different item if the ordering ever changes.
  const itemKey = (category, name) => `${category}::${name}`

  const checksFor = (listId) => savedListChecks[listId] || {}

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
    return formatQuantity(num * ratio, m[2], currentLang, { roundUpWhole: true })
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
        if (item.custom) return { name: item.name, shownName: item.name, label: scaleAmountString(item.quantity, ratio) }
        // `name` stays the key ticked-off state is stored under;
        // `shownName` is what's read ("1 Sitron").
        const shown = (quantity, unit) => ({
          name: item.name,
          shownName: nameForAmount(item, currentLang, quantity, unit, { roundUpWhole: true }),
          label: formatQuantity(quantity, unit, currentLang, { roundUpWhole: true }),
        })
        if (Array.isArray(item.sources) && item.sources.length > 0) {
          const scaled = item.sources.map(s => ({ ...s, quantity: (s.quantity || 0) * ratio }))
          // Lists saved before items carried their id find it by name.
          const c = combineQuantities(scaled, totalOptionsFor(item.ingredientId || resolveIngredientId(item)))
          // The per-recipe split comes back out alongside the total, so
          // the list can answer "which recipe is this for?" — built by
          // the same helper the live list's ⓘ popover uses, scaled first
          // so the split matches the portions on screen.
          return { ...shown(c.quantity, c.unit), breakdown: buildRecipeBreakdown(scaled, currentLang) }
        }
        if (typeof item.quantity === 'number') return shown(item.quantity * ratio, item.unit)
        return shown(item.quantity, item.unit)
      }),
    }))
  }

  function handlePrintViewing() {
    const groups = scaledGroups(viewing, portions).map(g => ({
      category: categoryLabel(g.category),
      items: g.items.map(it => ({ name: it.shownName, quantityLabel: it.label })),
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

  // Progress through the list being viewed. Counted from the rendered
  // groups rather than from the stored map, so a tick left behind by an
  // item that is no longer in the list can't push the count past the
  // total.
  const viewedTotal = viewGroups.reduce((n, g) => n + g.items.length, 0)
  const viewedChecked = viewing
    ? viewGroups.reduce(
      (n, g) => n + g.items.filter(it => checksFor(viewing.id)[itemKey(g.category, it.name)]).length,
      0,
    )
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 scrim" onClick={onClose} />
      <div className="relative z-10 sheet sm:max-w-md sheet-max-h flex flex-col">
        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          {viewing ? (
            <button onClick={() => setViewing(null)} className="btn-ghost -ml-2 px-2 text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('common.back', { defaultValue: 'Back' })}
            </button>
          ) : (
            <h2 className="section-title">{t('shopping.savedListsTitle')}</h2>
          )}
          <button onClick={onClose} className="btn-ghost btn-icon -mr-1.5 text-slate-400">
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
                    <button onClick={() => openList(list)} className="tap-target flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-slate-800 truncate">{list.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t('shopping.itemCount', { count: countItems(list.items) })}
                        {list.portions ? ` · ${t('shopping.forPortions', { count: list.portions, defaultValue: `for ${list.portions}` })}` : ''}
                        {' · '}{formatDate(list.savedAt)}
                      </p>
                    </button>
                    <button
                      onClick={() => openList(list)}
                      className="btn-secondary btn-sm flex-shrink-0"
                    >
                      {t('shopping.openList', { defaultValue: 'Open' })}
                    </button>
                    <button
                      onClick={() => handleDelete(list)}
                      className="btn-ghost btn-icon text-slate-400 hover:text-danger-500 flex-shrink-0"
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
                  {viewedTotal > 0 && (
                    <> · {t('shopping.checkedOfShort', {
                      checked: viewedChecked,
                      total: viewedTotal,
                      defaultValue: `${viewedChecked} of ${viewedTotal} checked`,
                    })}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-500">{t('shopping.portions', { defaultValue: 'Portions' })}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPortions(p => Math.max(1, p - 1))}
                    className="tap-target w-7 h-7 rounded-small bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                  >−</button>
                  <EditableNumber
                    value={portions}
                    onChange={setPortions}
                    min={1}
                    className="w-10 text-center text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-small py-1"
                  />
                  <button
                    onClick={() => setPortions(p => p + 1)}
                    className="tap-target w-7 h-7 rounded-small bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
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
                    {group.items.map((item, ii) => {
                      const key = itemKey(group.category, item.name)
                      const done = Boolean(checksFor(viewing.id)[key])
                      const hasBreakdown = item.breakdown?.length > 0
                      return (
                        <div key={ii} className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={() => toggleSavedListItem(viewing.id, key)}
                              className="w-4 h-4 rounded-small border-slate-300 text-primary-600 flex-shrink-0 cursor-pointer"
                            />
                            <span className={`flex-1 min-w-0 text-sm break-words ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {item.shownName}
                            </span>
                            {hasBreakdown && (
                              <button
                                onClick={() => setOpenBreakdown(openBreakdown === key ? null : key)}
                                className={`tap-target flex-shrink-0 w-5 h-5 rounded-full text-2xs font-semibold transition-colors ${
                                  openBreakdown === key
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-slate-300 hover:text-primary-500 hover:bg-primary-50'
                                }`}
                                title={t('shopping.whichRecipes', { defaultValue: 'Which recipes?' })}
                              >
                                i
                              </button>
                            )}
                            <span className={`text-sm font-medium whitespace-nowrap ${done ? 'text-slate-300' : 'text-slate-900'}`}>
                              {item.label}
                            </span>
                          </div>
                          {openBreakdown === key && (
                            <div className="mt-2 ml-7 space-y-1">
                              {item.breakdown.map((b, bi) => (
                                <div key={bi} className="flex items-baseline justify-between gap-3 text-xs">
                                  <span className="text-slate-500 min-w-0 break-words">
                                    {b.recipe}
                                    {b.note && <span className="block text-2xs text-slate-400">{b.note}</span>}
                                  </span>
                                  <span className="text-slate-400 whitespace-nowrap">{b.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="px-5 py-3 border-t border-slate-100">
              {viewedChecked > 0 && (
                <button
                  onClick={() => clearSavedListChecks(viewing.id)}
                  className="btn-ghost btn-sm w-full mb-2 text-slate-400 hover:text-slate-600"
                >
                  {t('shopping.clearChecks', { defaultValue: 'Clear all ticks' })}
                </button>
              )}
              <button onClick={handlePrintViewing} className="btn-secondary w-full">
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
