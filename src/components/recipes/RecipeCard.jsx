import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const CATEGORY_COLORS = {
  Breakfast: 'bg-amber-100 text-amber-700',
  Lunch: 'bg-green-100 text-green-700',
  Dinner: 'bg-indigo-100 text-indigo-700',
  Supper: 'bg-violet-100 text-violet-700',
  Bread: 'bg-orange-100 text-orange-700',
  Porridge: 'bg-yellow-100 text-yellow-700',
  Spreads: 'bg-lime-100 text-lime-700',
  Snack: 'bg-pink-100 text-pink-700',
  Dessert: 'bg-rose-100 text-rose-700',
  Other: 'bg-slate-100 text-slate-600',
}

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600'
}

function TimeChip({ minutes, label }) {
  // Guard against 0, null, undefined, or empty string
  const numMinutes = parseInt(minutes, 10)
  if (!numMinutes || numMinutes <= 0) return null
  const display = numMinutes >= 60
    ? `${Math.floor(numMinutes / 60)}h ${numMinutes % 60 > 0 ? `${numMinutes % 60}m` : ''}`.trim()
    : `${numMinutes}m`
  return (
    <span className="text-xs text-slate-500 flex items-center gap-0.5">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
      </svg>
      {label && <span className="text-slate-400">{label}</span>}
      {display}
    </span>
  )
}

export default function RecipeCard({ recipe, compact = false }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { type: 'recipe', recipeId: recipe.id },
  })

  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const displayTitle = recipe.translations?.[currentLang]?.title || recipe.title

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card group relative overflow-hidden transition-shadow duration-150 hover:shadow-md ${
        isDragging ? 'shadow-xl ring-2 ring-indigo-400' : ''
      } ${compact ? 'p-3' : 'p-4'}`}
      onClick={() => navigate(`/recipes/${recipe.id}`)}
    >
      {recipe.imageUrl && (
        <div className="relative -mx-4 -mt-4 mb-3 h-36 overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={`font-semibold text-slate-800 leading-tight line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
          {displayTitle}
        </h3>
        <span className={`badge ${categoryColor(recipe.category)} flex-shrink-0 text-xs`}>
          {t(`categories.${recipe.category}`, { defaultValue: recipe.category })}
        </span>
      </div>

      {!compact && (
        <div className="flex items-center gap-3 mt-2">
          {recipe.prepTime > 0 ? <TimeChip minutes={recipe.prepTime} label="prep " /> : null}
          {recipe.cookTime > 0 ? <TimeChip minutes={recipe.cookTime} label="cook " /> : null}
          {recipe.servings && (
            <span className="text-xs text-slate-500 flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {recipe.servings}
            </span>
          )}
        </div>
      )}

      {/* Drag handle indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
        <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8-10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
        </svg>
      </div>
    </div>
  )
}
