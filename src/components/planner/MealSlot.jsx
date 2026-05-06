import { useDroppable } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import useStore from '../../store/useStore'

const CATEGORY_BG = {
  Breakfast: 'bg-amber-50 border-amber-100',
  Lunch: 'bg-green-50 border-green-100',
  Dinner: 'bg-indigo-50 border-indigo-100',
  Supper: 'bg-violet-50 border-violet-100',
  default: 'bg-slate-50 border-slate-100',
}

export default function MealSlot({ day, slot, onAdd }) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const navigate = useNavigate()
  const pointerStartRef = useRef(null)
  const recipeIds = useStore(s => s.weekPlan[day]?.[slot] || [])
  const recipes = useStore(s => s.recipes)
  const removeRecipeFromSlot = useStore(s => s.removeRecipeFromSlot)

  // Track pointer-down position so we can distinguish a genuine click
  // from a drag gesture (dnd-kit's PointerSensor activates at 8px).
  function handleRecipePointerDown(e) {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  function handleRecipeClick(recipeId, e) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (start) {
      const dx = Math.abs(e.clientX - start.x)
      const dy = Math.abs(e.clientY - start.y)
      // Treat as a drag if the pointer moved more than a few pixels.
      if (dx > 5 || dy > 5) return
    }
    navigate(`/recipes/${recipeId}`)
  }

  const droppableId = `${day}__${slot}`
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { day, slot },
  })

  const slotRecipes = recipeIds
    .map(id => recipes.find(r => r.id === id))
    .filter(Boolean)

  const bgClass = CATEGORY_BG[slot] || CATEGORY_BG.default

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] rounded-xl border p-2 transition-all duration-150 ${bgClass} ${
        isOver ? 'ring-2 ring-indigo-400 ring-offset-1 border-indigo-300' : ''
      }`}
    >
      {slotRecipes.length === 0 && !isOver && (
        <div className="flex items-center justify-center h-12 text-xs text-slate-400">
          {t('planner.dropHere')}
        </div>
      )}

      {/* Recipe chips in slot */}
      <div className="space-y-1.5">
        {slotRecipes.map(recipe => (
          <div
            key={recipe.id}
            role="button"
            tabIndex={0}
            onPointerDown={handleRecipePointerDown}
            onClick={(e) => handleRecipeClick(recipe.id, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(`/recipes/${recipe.id}`)
              }
            }}
            className="group flex items-center gap-1.5 bg-white rounded-lg px-2 py-1.5 shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 hover:border-indigo-200 transition-colors"
          >
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
                removeRecipeFromSlot(day, slot, recipe.id)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 flex-shrink-0"
              title={t('common.remove')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
