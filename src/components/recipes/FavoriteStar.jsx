import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

/**
 * Small star button that toggles a recipe's favourite state. Uses the
 * favoriteRecipes array on the store so the same component works on
 * recipe cards in the grid and on the recipe detail header — they
 * stay in sync automatically.
 *
 * Stops click propagation so tapping the star never accidentally
 * navigates into the recipe (cards are clickable to open the recipe).
 *
 * Props:
 *   - recipeId: string
 *   - size: 'sm' | 'md' | 'lg'   (default 'md')
 *   - variant: 'overlay' | 'plain'  ('overlay' renders a translucent
 *      white circle behind the icon so it pops over photos)
 */
export default function FavoriteStar({ recipeId, size = 'md', variant = 'plain' }) {
  const { t } = useTranslation()
  const favourites = useStore(s => s.favoriteRecipes)
  const toggleFavorite = useStore(s => s.toggleFavorite)
  const isFav = favourites.includes(recipeId)

  const dim = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
  const padding = size === 'sm' ? 'p-1' : size === 'lg' ? 'p-2' : 'p-1.5'

  const wrap =
    variant === 'overlay'
      ? `${padding} rounded-full bg-white/85 backdrop-blur-sm shadow-sm hover:bg-white transition-colors`
      : `${padding} rounded-full hover:bg-amber-50 transition-colors`

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        toggleFavorite(recipeId)
      }}
      aria-pressed={isFav}
      aria-label={isFav
        ? t('favorites.remove', { defaultValue: 'Remove from favorites' })
        : t('favorites.add', { defaultValue: 'Add to favorites' })}
      title={isFav
        ? t('favorites.remove', { defaultValue: 'Remove from favorites' })
        : t('favorites.add', { defaultValue: 'Add to favorites' })}
      className={wrap}
    >
      {isFav ? (
        // Solid amber star when favourited
        <svg className={`${dim} text-amber-400`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
        </svg>
      ) : (
        // Outlined star when not favourited
        <svg className={`${dim} text-slate-400 hover:text-amber-500 transition-colors`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
        </svg>
      )}
    </button>
  )
}
