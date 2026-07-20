import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { generateShoppingList, formatQuantity } from '../../utils/shoppingListGenerator'
import { combineQuantities } from '../../utils/ingredientMatcher'
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
  const customShoppingItems = useStore(s => s.customShoppingItems) || []
  const addCustomShoppingItem = useStore(s => s.addCustomShoppingItem)
  const removeCustomShoppingItem = useStore(s => s.removeCustomShoppingItem)
  const dismissedShoppingItems = useStore(s => s.dismissedShoppingItems) || {}
  const dismissShoppingItem = useStore(s => s.dismissShoppingItem)
  const undismissShoppingItem = useStore(s => s.undismissShoppingItem)
  const restoreDismissedShoppingItems = useStore(s => s.restoreDismissedShoppingItems)
  const pruneDismissedShoppingItems = useStore(s => s.pruneDismissedShoppingItems)
  const dismissedShoppingSources = useStore(s => s.dismissedShoppingSources) || {}
  const dismissShoppingSource = useStore(s => s.dismissShoppingSource)
  const undismissShoppingSource = useStore(s => s.undismissShoppingSource)
  const restoreDismissedShoppingSources = useStore(s => s.restoreDismissedShoppingSources)
  const pruneDismissedShoppingSources = useStore(s => s.pruneDismissedShoppingSources)
  const restoreCustomShoppingItem = useStore(s => s.restoreCustomShoppingItem)
  const batchCook = useStore(s => s.batchCook) || []

  const [showChecked, setShowChecked] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSavedLists, setShowSavedLists] = useState(false)
  const [listName, setListName] = useState('')
  const [saveToast, setSaveToast] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [infoOpenId, setInfoOpenId] = useState(null)
  const [undoInfo, setUndoInfo] = useState(null) // { label, revert }
  const undoTimer = useRef(null)

  const rawGroups = generateShoppingList(weekPlan, recipes, familySize, currentLang, batchCook)

  const srcKey = (itemId, recipe) => `${itemId}::${recipe}`

  // Apply per-item and per-source removals. An item whose every source was
  // removed disappears; an item with some sources removed keeps a total
  // recomputed from what's left. This is what we display / count / save.
  const groups = rawGroups
    .map(g => ({
      category: g.category,
      items: g.items
        .filter(i => !dismissedShoppingItems[i.id])
        .map(i => {
          const allSources = i.sources || []
          if (allSources.length === 0) return i
          const sources = allSources.filter(s => !dismissedShoppingSources[srcKey(i.id, s.recipe)])
          if (sources.length === 0) return null // all contributions removed
          if (sources.length === allSources.length) return { ...i, sources }
          const c = combineQuantities(sources)
          return { ...i, sources, quantity: c.quantity, unit: c.unit || '' }
        })
        .filter(Boolean),
    }))
    .filter(g => g.items.length > 0)

  const generatedTotal = groups.reduce((sum, g) => sum + g.items.length, 0)
  const totalItems = generatedTotal + customShoppingItems.length

  // Count of active removals (whole items + single contributions) that
  // belong to the current list — drives the "restore all" footer.
  const currentItemIds = new Set(rawGroups.flatMap(g => g.items.map(i => i.id)))
  const currentSourceKeys = new Set(
    rawGroups.flatMap(g => g.items.flatMap(i => (i.sources || []).map(s => srcKey(i.id, s.recipe))))
  )
  const dismissedCount =
    Object.keys(dismissedShoppingItems).filter(id => currentItemIds.has(id)).length +
    Object.keys(dismissedShoppingSources).filter(k => currentSourceKeys.has(k)).length

  // Stable keys for pruning stale checked/dismissed entries once ids leave.
  const currentIdsKey = useMemo(
    () => [
      ...rawGroups.flatMap(g => g.items.map(i => i.id)),
      ...customShoppingItems.map(i => i.id),
    ].sort().join('|'),
    [rawGroups, customShoppingItems]
  )
  const currentSourceKeysKey = useMemo(
    () => rawGroups.flatMap(g => g.items.flatMap(i => (i.sources || []).map(s => srcKey(i.id, s.recipe)))).sort().join('|'),
    [rawGroups]
  )

  // Auto-prune: whenever the active list changes, drop any checked
  // entries that no longer correspond to a visible item. Without this,
  // changing the weekplan leaves stale check marks behind and the
  // "X of Y checked" counter goes nonsensical (32 of 7, etc.).
  useEffect(() => {
    const validIds = new Set(currentIdsKey ? currentIdsKey.split('|') : [])
    pruneCheckedItems(validIds)
    pruneDismissedShoppingItems(validIds)
    const validSrc = new Set(currentSourceKeysKey ? currentSourceKeysKey.split('|') : [])
    pruneDismissedShoppingSources(validSrc)
  }, [currentIdsKey, currentSourceKeysKey, pruneCheckedItems, pruneDismissedShoppingItems, pruneDismissedShoppingSources])

  // Show a short-lived "Removed X · Undo" toast after any deletion.
  function pushUndo(label, revert) {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndoInfo({ label, revert })
    undoTimer.current = setTimeout(() => setUndoInfo(null), 7000)
  }
  function handleUndo() {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoInfo?.revert?.()
    setUndoInfo(null)
  }

  function removeWholeItem(item) {
    dismissShoppingItem(item.id)
    setInfoOpenId(null)
    pushUndo(t('shopping.removedItem', { name: item.name, defaultValue: `Removed ${item.name}` }),
      () => undismissShoppingItem(item.id))
  }
  function removeSource(item, recipe) {
    dismissShoppingSource(item.id, recipe)
    pushUndo(t('shopping.removedItem', { name: item.name, defaultValue: `Removed ${item.name}` }),
      () => undismissShoppingSource(item.id, recipe))
  }
  function removeCustom(item) {
    const snapshot = { ...item }
    removeCustomShoppingItem(item.id)
    pushUndo(t('shopping.removedItem', { name: item.name, defaultValue: `Removed ${item.name}` }),
      () => restoreCustomShoppingItem(snapshot))
  }
  function restoreAllRemoved() {
    restoreDismissedShoppingItems()
    restoreDismissedShoppingSources()
  }

  // Count ONLY the items in the active list (defensive — even if the
  // prune effect lags one tick, the displayed number is honest).
  const checkedCount =
    groups.reduce(
      (n, g) => n + g.items.reduce((m, item) => m + (checkedItems[item.id] ? 1 : 0), 0),
      0
    ) + customShoppingItems.reduce((n, i) => n + (checkedItems[i.id] ? 1 : 0), 0)

  function handleAddCustomItem() {
    if (!newItemName.trim()) return
    addCustomShoppingItem(newItemName, newItemAmount)
    setNewItemName('')
    setNewItemAmount('')
    // Keep the form open so several items can be added in a row.
  }

  // Per-recipe breakdown for the little ⓘ popover: how much of this
  // ingredient came from each recipe (contributions summed per recipe).
  function recipeBreakdown(item) {
    const byRecipe = {}
    for (const s of item.sources || []) {
      (byRecipe[s.recipe] = byRecipe[s.recipe] || []).push(s)
    }
    return Object.entries(byRecipe).map(([recipe, arr]) => {
      const c = combineQuantities(arr)
      return { recipe, label: formatQuantity(c.quantity, c.unit) }
    })
  }

  function handleSaveList() {
    const name = listName.trim()
    if (!name) return
    // Save the generated groups (which carry per-recipe `sources` for
    // re-scaling) plus any custom items, tagged with the portion count.
    const groupsToSave = groups.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }))
    if (customShoppingItems.length > 0) {
      groupsToSave.push({
        category: '__custom__',
        items: customShoppingItems.map(i => ({
          id: i.id, name: i.name, quantity: i.amount || '', unit: '', custom: true,
        })),
      })
    }
    saveShoppingList(name, groupsToSave, familySize)
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

    // Append the user's own items as their own aisle at the end.
    if (customShoppingItems.length > 0) {
      printGroups.push({
        category: t('shopping.myItems', { defaultValue: 'My items' }),
        items: customShoppingItems.map((it) => ({ name: it.name, quantityLabel: it.amount || '' })),
      })
    }

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

  // The "+ Add item" affordance — a dashed button that expands into a
  // name + amount form. Reused in the empty state and at the end of the
  // populated list.
  const addItemSection = showAddForm ? (
    <div className="card p-3 border border-indigo-100 relative">
      <button
        onClick={() => { setShowAddForm(false); setNewItemName(''); setNewItemAmount('') }}
        className="absolute top-2 right-2 text-slate-300 hover:text-slate-500"
        title={t('common.close', { defaultValue: 'Close' })}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="flex gap-2 pr-6">
        <input
          className="input flex-1"
          placeholder={t('shopping.itemNamePlaceholder', { defaultValue: 'Item name…' })}
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddCustomItem()}
          autoFocus
        />
        <input
          className="input w-24"
          placeholder={t('shopping.itemAmountPlaceholder', { defaultValue: 'Amount' })}
          value={newItemAmount}
          onChange={e => setNewItemAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddCustomItem()}
        />
      </div>
      <button
        onClick={handleAddCustomItem}
        disabled={!newItemName.trim()}
        className="btn-primary w-full mt-2 text-sm py-2"
      >
        {t('shopping.addItem', { defaultValue: 'Add item' })}
      </button>
    </div>
  ) : (
    <button
      onClick={() => setShowAddForm(true)}
      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors text-sm font-medium"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      {t('shopping.addItem', { defaultValue: 'Add item' })}
    </button>
  )

  if (totalItems === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('shopping.noItemsYet')}</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            {t('shopping.noItemsDesc')}
          </p>
        </div>
        <div className="px-4 pb-24 lg:pb-8 space-y-3">
          {dismissedCount > 0 && (
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-slate-500">
              <span>{t('shopping.removedCount', { count: dismissedCount, defaultValue: `${dismissedCount} removed` })}</span>
              <button onClick={restoreAllRemoved} className="font-medium text-indigo-600 hover:text-indigo-700">
                {t('shopping.restoreAll', { defaultValue: 'Restore all' })}
              </button>
            </div>
          )}
          {addItemSection}
        </div>
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
                  const hasSources = item.sources && item.sources.length > 0
                  return (
                    <div
                      key={item.id}
                      className={`relative flex items-center gap-2 px-4 py-3 hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'opacity-50' : ''
                      }`}
                    >
                      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheckedItem(item.id)}
                          className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                        />
                        <span className={`flex-1 min-w-0 text-sm text-slate-700 ${isChecked ? 'line-through' : ''}`}>
                          {item.name}
                        </span>
                      </label>
                      <span className={`text-sm font-medium whitespace-nowrap ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {formatQuantity(item.quantity, item.unit)}
                      </span>

                      {/* ⓘ breakdown — which recipes contributed how much */}
                      {hasSources && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setInfoOpenId(infoOpenId === item.id ? null : item.id)}
                            className={`transition-colors ${infoOpenId === item.id ? 'text-indigo-500' : 'text-slate-300 hover:text-indigo-500'}`}
                            title={t('shopping.breakdown', { defaultValue: 'Where this comes from' })}
                            aria-label={t('shopping.breakdown', { defaultValue: 'Where this comes from' })}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                          </button>
                          {infoOpenId === item.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setInfoOpenId(null)} />
                              <div className="absolute right-0 top-6 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-3 text-left">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                  {t('shopping.breakdown', { defaultValue: 'Where this comes from' })}
                                </p>
                                <div className="space-y-1">
                                  {recipeBreakdown(item).map((r, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 text-xs py-0.5">
                                      <span className="text-slate-600 min-w-0 break-words flex-1">{r.recipe}</span>
                                      <span className="text-slate-900 font-medium whitespace-nowrap">{r.label}</span>
                                      {item.sources.length > 1 && (
                                        <button
                                          onClick={() => removeSource(item, r.recipe)}
                                          className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                                          title={t('shopping.removeContribution', { defaultValue: 'Remove this contribution' })}
                                          aria-label={t('shopping.removeContribution', { defaultValue: 'Remove this contribution' })}
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <div className="flex items-baseline justify-between gap-3 text-xs pt-1.5 mt-1 border-t border-slate-100">
                                    <span className="text-slate-500">{t('shopping.total', { defaultValue: 'Total' })}</span>
                                    <span className="text-slate-900 font-semibold whitespace-nowrap">{formatQuantity(item.quantity, item.unit)}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeWholeItem(item)}
                                  className="mt-2.5 w-full text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg py-1.5 transition-colors"
                                >
                                  {t('shopping.removeAll', { defaultValue: 'Remove all from list' })}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Delete — direct for single-source, opens the
                          per-recipe menu when several recipes contribute. */}
                      <button
                        onClick={() => {
                          if (hasSources && item.sources.length > 1) setInfoOpenId(item.id)
                          else removeWholeItem(item)
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                        title={t('common.remove')}
                        aria-label={t('common.remove')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* My items — the user's own manually-added entries */}
        {(() => {
          const visibleCustom = showChecked
            ? customShoppingItems
            : customShoppingItems.filter(i => !checkedItems[i.id])
          if (visibleCustom.length === 0) return null
          return (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                {t('shopping.myItems', { defaultValue: 'My items' })}
              </h3>
              <div className="card divide-y divide-slate-50">
                {visibleCustom.map(item => {
                  const isChecked = Boolean(checkedItems[item.id])
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors ${isChecked ? 'opacity-50' : ''}`}
                    >
                      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheckedItem(item.id)}
                          className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={`flex-1 text-sm text-slate-700 ${isChecked ? 'line-through' : ''}`}>
                          {item.name}
                        </span>
                      </label>
                      {item.amount && (
                        <span className={`text-sm font-medium ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {item.amount}
                        </span>
                      )}
                      <button
                        onClick={() => removeCustom(item)}
                        className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                        title={t('common.remove')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Removed-items notice with a one-tap restore */}
        {dismissedCount > 0 && (
          <div className="flex items-center justify-between gap-2 px-1 text-xs text-slate-500">
            <span>{t('shopping.removedCount', { count: dismissedCount, defaultValue: `${dismissedCount} removed` })}</span>
            <button
              onClick={restoreAllRemoved}
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              {t('shopping.restoreAll', { defaultValue: 'Restore all' })}
            </button>
          </div>
        )}

        {/* Add-your-own-item affordance */}
        {addItemSection}

        {/* Recipe source summary — only when the plan contributed items */}
        {generatedTotal > 0 && (
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
        )}
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

      {/* Undo (regret) toast after a deletion */}
      {undoInfo && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl max-w-[90vw]">
          <span className="truncate">{undoInfo.label}</span>
          <button onClick={handleUndo} className="font-semibold text-indigo-300 hover:text-indigo-200 flex-shrink-0">
            {t('shopping.undo', { defaultValue: 'Undo' })}
          </button>
        </div>
      )}
    </div>
  )
}
