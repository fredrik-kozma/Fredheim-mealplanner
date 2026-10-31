import EmptyState from '../common/EmptyState'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { generateShoppingList, totalOptionsFor } from '../../utils/shoppingListGenerator'
import { formatQuantity } from '../../utils/formatQuantity'
import { nameForAmount } from '../../utils/ingredientDictionary'
import { combineQuantities } from '../../utils/ingredientMatcher'
import { buildRecipeBreakdown } from '../../utils/recipeBreakdown'
import { printShoppingList } from '../../utils/printShoppingList'
import SavedShoppingLists from './SavedShoppingLists'
import ShareModal from '../share/ShareModal'
import { buildShoppingPayload } from '../../utils/sharePayload'
import { shoppingListAsText } from '../../utils/shareText'

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
  // Names the shared list after the week it came from, when the week has
  // a name — 'Uke 43' tells the recipient more than 'Handleliste'.
  const activeWeekName = useStore(s => s.activeWeekName)

  const [showChecked, setShowChecked] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  // Which action is asking "whole list or only what's left?" — 'print',
  // 'share', or null when nothing is asking. One dialog serves both
  // because it is the same question with the same two answers.
  const [scopeFor, setScopeFor] = useState(null)
  const [sharing, setSharing] = useState(null)
  const [showSavedLists, setShowSavedLists] = useState(false)
  const [listName, setListName] = useState('')
  const [saveToast, setSaveToast] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [infoOpenId, setInfoOpenId] = useState(null)
  const [undoInfo, setUndoInfo] = useState(null) // { label, revert }
  const undoTimer = useRef(null)

  // The salt level picks which salt amount is bought (Settings), or a
  // recipe's own choice from its page.
  const saltLevel = useStore(s => s.saltLevel)
  const recipeSaltLevels = useStore(s => s.recipeSaltLevels)
  const rawGroups = generateShoppingList(weekPlan, recipes, familySize, currentLang, batchCook, { saltLevel, recipeSaltLevels })

  const srcKey = (itemId, recipe) => `${itemId}::${recipe}`

  // "1 Sitron", not "1 Sitroner". Only for display: ids and ticked-off
  // state stay keyed on the item's own name.
  const shownName = (it) => nameForAmount(it, currentLang, it.quantity, it.unit, { roundUpWhole: true })

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
          const c = combineQuantities(sources, totalOptionsFor(i.ingredientId))
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
  // Shared with the saved-list viewer so the two round identically —
  // see recipeBreakdown.js for why parts are not rounded up the way the
  // total above them is.
  const recipeBreakdown = (item) => buildRecipeBreakdown(item.sources, currentLang)

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

  /**
   * Hand the list to someone else. `skipChecked` means "only what's
   * still to buy", the same choice the printout offers and filtered the
   * same way, so the two can't disagree about what the list is.
   *
   * Two deliberate details:
   *
   * Aisle names go in the link as their raw English keys, not as the
   * words on this screen. The recipient translates them through their
   * own i18n, so a Norwegian list opens in Swedish as Swedish aisles.
   *
   * Amounts go as a number and a unit rather than the "400 g" shown
   * here, because the saved-list viewer re-scales a numeric quantity.
   * Send the rendered string and the recipient is stuck with portions
   * for the sender's household.
   */
  function handleShare(skipChecked = false) {
    const keep = (it) => !skipChecked || !checkedItems[it.id]

    const payloadGroups = groups
      .map(({ category, items }) => ({ category, items: items.filter(keep) }))
      .filter(g => g.items.length > 0)

    const customToShare = customShoppingItems.filter(keep)
    if (customToShare.length > 0) {
      payloadGroups.push({
        category: '__custom__',
        items: customToShare.map(i => ({ name: i.name, quantity: i.amount || '', custom: true })),
      })
    }

    const name = activeWeekName || t('shopping.title', { defaultValue: 'Shopping list' })
    const count = payloadGroups.reduce((n, g) => n + g.items.length, 0)

    setSharing({
      payload: buildShoppingPayload({ name, portions: familySize, groups: payloadGroups }),
      title: name,
      text: shoppingListAsText({
        heading: name,
        subtitle: t('shopping.forPeople', { count: familySize, defaultValue: 'for {{count}} people' }),
        groups: payloadGroups.map(g => ({
          category: g.category === '__custom__'
            ? t('shopping.myItems', { defaultValue: 'My items' })
            : t(`aisles.${g.category}`, { defaultValue: g.category }),
          items: g.items.map(it => ({
            name: it.custom ? it.name : shownName(it),
            label: it.custom ? (it.quantity || '') : formatQuantity(it.quantity, it.unit, currentLang, { roundUpWhole: true }),
          })),
        })),
        url: null,
      }),
      count,
    })
  }

  // `skipChecked` leaves out everything already ticked off in the app, so
  // the printed sheet is only what's still to buy. An aisle that empties
  // out that way is dropped rather than printed as a bare heading.
  function handlePrint(skipChecked = false) {
    const keep = (it) => !skipChecked || !checkedItems[it.id]

    // Aisle category labels (e.g. "Produce") are stored in English on the
    // shopping list groups; translate them via i18n for the printout.
    const printGroups = groups
      .map(({ category, items }) => ({
        category: t(`aisles.${category}`, { defaultValue: category }),
        items: items.filter(keep).map((it) => ({
          name: shownName(it),
          quantityLabel: formatQuantity(it.quantity, it.unit, currentLang, { roundUpWhole: true }),
        })),
      }))
      .filter(g => g.items.length > 0)

    // Append the user's own items as their own aisle at the end.
    const customToPrint = customShoppingItems.filter(keep)
    if (customToPrint.length > 0) {
      printGroups.push({
        category: t('shopping.myItems', { defaultValue: 'My items' }),
        items: customToPrint.map((it) => ({ name: it.name, quantityLabel: it.amount || '' })),
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

    // Everything was ticked off — printing would produce an empty sheet.
    if (printGroups.length === 0) {
      setSaveToast(t('shopping.printNothingLeft', { defaultValue: 'Nothing left to print — every item is checked off.' }))
      setTimeout(() => setSaveToast(null), 3000)
      return
    }

    printShoppingList({
      title: t('shopping.title'),
      groups: printGroups,
      familySize,
      recipeTitles,
      // Date follows the app's language, not the browser's.
      locale: i18n.language || undefined,
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
    <div className="card p-3 border border-primary-100 relative">
      <button
        onClick={() => { setShowAddForm(false); setNewItemName(''); setNewItemAmount('') }}
        className="tap-target absolute top-2 right-2 text-slate-300 hover:text-slate-500"
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
        className="btn-primary w-full mt-2"
      >
        {t('shopping.addItem', { defaultValue: 'Add item' })}
      </button>
    </div>
  ) : (
    <button
      onClick={() => setShowAddForm(true)}
      className="tap-target w-full flex items-center justify-center gap-1.5 py-3 rounded-control border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/40 transition-colors text-sm font-medium"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      {t('shopping.addItem', { defaultValue: 'Add item' })}
    </button>
  )

  if (totalItems === 0) {
    return (
      <div className="flex flex-col h-full">
        <EmptyState
          className="flex-1"
          icon="🛒"
          title={t('shopping.noItemsYet')}
          body={t('shopping.noItemsDesc')}
        />
        <div className="px-4 pb-nav lg:pb-8 space-y-3">
          {dismissedCount > 0 && (
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-slate-500">
              <span>{t('shopping.removedCount', { count: dismissedCount, defaultValue: `${dismissedCount} removed` })}</span>
              <button onClick={restoreAllRemoved} className="text-link">
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
      <div className="px-4 pt-1 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-[10rem]">
            <p className="text-sm text-slate-500 truncate">
              {t('shopping.checkedOf', { checked: checkedCount, total: totalItems, people: familySize })}
            </p>
            {/* Progress bar */}
            <div className="mt-1.5 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>
          {/* Wraps instead of pushing its last buttons off the side of a phone. */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <button
              onClick={() => {
                // Nothing ticked off yet → no choice to make, just print.
                if (checkedCount > 0) setScopeFor('print')
                else handlePrint(false)
              }}
              className="btn-secondary btn-sm"
              title={t('shopping.print', { defaultValue: 'Print' })}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
              <span className="hidden sm:inline">{t('shopping.print', { defaultValue: 'Print' })}</span>
            </button>
            <button
              onClick={() => {
                // Same rule as printing: with nothing ticked there is no
                // choice to make, so don't make them answer a question.
                if (checkedCount > 0) setScopeFor('share')
                else handleShare(false)
              }}
              disabled={totalItems === 0}
              className="btn-secondary btn-sm"
              title={t('shopping.share', { defaultValue: 'Share' })}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
              <span className="hidden sm:inline">{t('shopping.share', { defaultValue: 'Share' })}</span>
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn-secondary btn-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
              <span className="hidden sm:inline">{t('shopping.saveList')}</span>
            </button>
            <button
              onClick={() => setShowSavedLists(true)}
              className="btn-ghost btn-sm"
            >
              {t('shopping.savedLists')}
            </button>
            <button
              onClick={() => setShowChecked(s => !s)}
              className="btn-ghost btn-sm"
            >
              {showChecked ? t('shopping.hideChecked') : t('shopping.showChecked')}
            </button>
            {checkedCount > 0 && (
              <button onClick={clearCheckedItems} className="btn-ghost btn-sm text-danger-400 hover:text-danger-600">
                {t('shopping.clearAll')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-4 pb-nav lg:pb-8 space-y-4">
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
                          className="w-5 h-5 rounded-small border-slate-300 text-primary-600 cursor-pointer flex-shrink-0"
                        />
                        <span className={`flex-1 min-w-0 text-sm text-slate-700 ${isChecked ? 'line-through' : ''}`}>
                          {shownName(item)}
                        </span>
                      </label>
                      <span className={`text-sm font-medium whitespace-nowrap ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {formatQuantity(item.quantity, item.unit, currentLang, { roundUpWhole: true })}
                      </span>

                      {/* ⓘ breakdown — which recipes contributed how much */}
                      {hasSources && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setInfoOpenId(infoOpenId === item.id ? null : item.id)}
                            className={`tap-target transition-colors ${infoOpenId === item.id ? 'text-primary-500' : 'text-slate-300 hover:text-primary-500'}`}
                            title={t('shopping.breakdown', { defaultValue: 'Where this comes from' })}
                            aria-label={t('shopping.breakdown', { defaultValue: 'Where this comes from' })}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                          </button>
                          {infoOpenId === item.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setInfoOpenId(null)} />
                              <div className="absolute right-0 top-6 z-30 w-64 bg-white rounded-control shadow-overlay border border-slate-100 p-3 text-left">
                                <p className="eyebrow mb-2">
                                  {t('shopping.breakdown', { defaultValue: 'Where this comes from' })}
                                </p>
                                <div className="space-y-1">
                                  {recipeBreakdown(item).map((r, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 text-xs py-0.5">
                                      <span className="text-slate-600 min-w-0 break-words flex-1">
                                        {r.recipe}
                                        {r.note && <span className="block text-2xs text-slate-400">{r.note}</span>}
                                      </span>
                                      <span className="text-slate-900 font-medium whitespace-nowrap">{r.label}</span>
                                      {item.sources.length > 1 && (
                                        <button
                                          onClick={() => removeSource(item, r.recipe)}
                                          className="tap-target text-slate-300 hover:text-danger-500 transition-colors flex-shrink-0"
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
                                    <span className="text-slate-900 font-semibold whitespace-nowrap">{formatQuantity(item.quantity, item.unit, currentLang, { roundUpWhole: true })}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeWholeItem(item)}
                                  className="tap-target mt-2.5 w-full text-xs font-medium text-danger-600 hover:bg-danger-50 rounded-small py-1.5 transition-colors"
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
                        className="tap-target text-slate-300 hover:text-danger-500 transition-colors flex-shrink-0"
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
                          className="w-5 h-5 rounded-small border-slate-300 text-primary-600 cursor-pointer"
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
                        className="tap-target text-slate-300 hover:text-danger-500 transition-colors flex-shrink-0"
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
              className="text-link"
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
                  <span key={rid} className="badge bg-primary-50 text-primary-700 text-xs">
                    {recipe.translations?.[currentLang]?.title || recipe.title}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Whole list or only what is left? Asked by printing and by sharing
          alike, and only when something is actually ticked off, so the
          common case stays a single tap. */}
      {scopeFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 scrim" onClick={() => setScopeFor(null)} />
          <div className="relative z-10 sheet sm:max-w-sm p-5">
            <div className="sm:hidden flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>
            <h2 className="section-title mb-1">
              {scopeFor === 'share'
                ? t('shopping.shareOptionsTitle', { defaultValue: 'What should be shared?' })
                : t('shopping.printOptionsTitle', { defaultValue: 'What should be printed?' })}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {t('shopping.checkedOf', { checked: checkedCount, total: totalItems, people: familySize })}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { const run = scopeFor === 'share' ? handleShare : handlePrint; setScopeFor(null); run(true) }}
                disabled={checkedCount >= totalItems}
                className="tap-target w-full text-left px-4 py-3 rounded-control border-2 border-primary-500 bg-primary-50/50 hover:bg-primary-50 transition-colors disabled:opacity-40 disabled:border-slate-200 disabled:bg-transparent disabled:cursor-not-allowed"
              >
                <span className="block text-sm font-semibold text-slate-800">
                  {t('shopping.printUnchecked', { defaultValue: 'Only what is left' })}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  {/* `n`, not `count` — `count` would send i18next down its
                      plural-key lookup for a string that has no plural forms. */}
                  {checkedCount >= totalItems
                    ? t('shopping.printNothingLeftShort', { defaultValue: 'Nothing left — everything is checked off' })
                    : t('shopping.printUncheckedHint', {
                        n: totalItems - checkedCount,
                        defaultValue: `${totalItems - checkedCount} items — checked ones are left out`,
                      })}
                </span>
              </button>
              <button
                onClick={() => { const run = scopeFor === 'share' ? handleShare : handlePrint; setScopeFor(null); run(false) }}
                className="tap-target w-full text-left px-4 py-3 rounded-control border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <span className="block text-sm font-semibold text-slate-800">
                  {t('shopping.printAll', { defaultValue: 'The whole list' })}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  {t('shopping.printAllHint', {
                    n: totalItems,
                    defaultValue: `All ${totalItems} items, checked or not`,
                  })}
                </span>
              </button>
            </div>
            <button onClick={() => setScopeFor(null)} className="btn-secondary w-full mt-3">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Save list modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 scrim" onClick={() => setShowSaveModal(false)} />
          <div className="relative z-10 sheet sm:max-w-sm p-5">
            <div className="sm:hidden flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>
            <h2 className="section-title mb-4">{t('shopping.saveListTitle')}</h2>
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

      {sharing && (
        <ShareModal
          kind="shopping"
          payload={sharing.payload}
          text={sharing.text}
          title={sharing.title}
          onClose={() => setSharing(null)}
        />
      )}

      {/* Toast */}
      {saveToast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-control shadow-overlay">
          <svg className="w-4 h-4 text-success-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {saveToast}
        </div>
      )}

      {/* Undo (regret) toast after a deletion */}
      {undoInfo && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-900 text-white text-sm px-4 py-3 rounded-control shadow-overlay max-w-[90vw]">
          <span className="truncate">{undoInfo.label}</span>
          <button onClick={handleUndo} className="tap-target font-semibold text-primary-300 hover:text-primary-200 flex-shrink-0">
            {t('shopping.undo', { defaultValue: 'Undo' })}
          </button>
        </div>
      )}
    </div>
  )
}
