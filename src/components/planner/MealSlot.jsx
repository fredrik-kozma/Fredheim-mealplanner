import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import useStore, { normalizeSlotItem } from '../../store/useStore'

const CATEGORY_BG = {
  Breakfast: 'bg-amber-50 border-amber-100',
  Lunch: 'bg-green-50 border-green-100',
  Dinner: 'bg-indigo-50 border-indigo-100',
  Supper: 'bg-violet-50 border-violet-100',
  default: 'bg-slate-50 border-slate-100',
}

// ── One recipe chip inside a slot, with inline servings adjuster ─────────────
function SlotItemChip({ day, slot, item, recipe, currentLang }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const familySize = useStore(s => s.familySize)
  const setSlotItemServings = useStore(s => s.setSlotItemServings)
  const removeRecipeFromSlot = useStore(s => s.removeRecipeFromSlot)
  const pointerStartRef = useRef(null)
  const [showAdjuster, setShowAdjuster] = useState(false)

  // What's the effective serving count for this slot? Override → household → 4
  const effectiveServings = item.servings ?? familySize ?? 4

  function handlePointerDown(e) {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  function handleClick(e) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (start) {
      const dx = Math.abs(e.clientX - start.x)
      const dy = Math.abs(e.clientY - start.y)
      if (dx > 5 || dy > 5) return // it was a drag
    }
    // Tell the recipe page where we came from so its Back button can
    // return here instead of the recipes list.
    navigate(`/recipes/${item.recipeId}`, { state: { from: '/planner' } })
  }

  function bumpServings(delta, e) {
    e.stopPropagation()
    setSlotItemServings(day, slot, item.recipeId, Math.max(1, effectiveServings + delta))
  }

  function resetServings(e) {
    e.stopPropagation()
    setSlotItemServings(day, slot, item.recipeId, null)
  }

  function toggleAdjuster(e) {
    e.stopPropagation()
    setShowAdjuster(v => !v)
  }

  const isOverridden = item.servings != null

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/recipes/${item.recipeId}`, { state: { from: '/planner' } })
        }
      }}
      className="group bg-white rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 hover:border-indigo-200 transition-colors"
    >
      {/* Top row: image + title + delete */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
        ) : (
          <span className="text-sm flex-shrink-0">🍽</span>
        )}
        <span className="text-xs font-medium text-slate-700 flex-1 leading-tight line-clamp-1">
          {recipe.translations?.[currentLang]?.title || recipe.title}
        </span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            removeRecipeFromSlot(day, slot, item.recipeId)
          }}
          className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
          title={t('common.remove')}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Bottom row: servings pill (always visible, tap to expand) */}
      <div className="px-2 pb-1.5 -mt-0.5">
        {showAdjuster ? (
          <div
            className="flex items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => bumpServings(-1, e)}
              disabled={effectiveServings <= 1}
              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-bold flex items-center justify-center transition-colors"
            >
              −
            </button>
            <span className="flex-1 text-center text-xs font-semibold text-slate-700">
              {effectiveServings} {t('planner.servingsShort', { defaultValue: 'serv.' })}
            </span>
            <button
              onClick={(e) => bumpServings(1, e)}
              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition-colors"
            >
              +
            </button>
            {isOverridden && (
              <button
                onClick={resetServings}
                className="text-[10px] text-slate-400 hover:text-indigo-600 px-1 transition-colors"
                title={t('planner.resetServings', { defaultValue: 'Use household default' })}
              >
                ↺
              </button>
            )}
            <button
              onClick={toggleAdjuster}
              className="text-slate-300 hover:text-slate-500 ml-0.5"
              title={t('common.close')}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={toggleAdjuster}
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${
              isOverridden
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title={t('planner.adjustServings', { defaultValue: 'Adjust servings' })}
          >
            👥 {effectiveServings}
          </button>
        )}
      </div>
    </div>
  )
}

export default function MealSlot({ day, slot, onAdd }) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const slotItems = useStore(s => s.weekPlan[day]?.[slot] || [])
  const recipes = useStore(s => s.recipes)

  const droppableId = `${day}__${slot}`
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { day, slot },
  })

  // Normalize items (handles any leftover string-form items just in case)
  const slotPairs = slotItems
    .map(it => {
      const norm = normalizeSlotItem(it)
      if (!norm) return null
      const recipe = recipes.find(r => r.id === norm.recipeId)
      return recipe ? { item: norm, recipe } : null
    })
    .filter(Boolean)

  const bgClass = CATEGORY_BG[slot] || CATEGORY_BG.default

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-xl border p-2 transition-all duration-150 ${bgClass} ${
        isOver ? 'ring-2 ring-indigo-400 ring-offset-1 border-indigo-300' : ''
      }`}
    >
      {/* Empty placeholder — kept for vertical spacing only when the slot
          is the drop target. No "Drop here" label: the empty card + the
          "+ Add" button below already make the affordance clear. */}
      {slotPairs.length === 0 && isOver && (
        <div className="flex items-center justify-center h-12 text-xs font-medium text-indigo-500">
          {t('planner.dropHere')}
        </div>
      )}

      {/* Recipe chips in slot */}
      <div className="space-y-1.5">
        {slotPairs.map(({ item, recipe }) => (
          <SlotItemChip
            key={item.recipeId}
            day={day}
            slot={slot}
            item={item}
            recipe={recipe}
            currentLang={currentLang}
          />
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 rounded-lg text-xs text-slate-400 hover:text-indigo-600 hover:bg-white/80 transition-colors duration-150"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {t('planner.add')}
      </button>
    </div>
  )
}
