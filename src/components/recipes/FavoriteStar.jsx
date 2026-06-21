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
      : `${padding} rounded-full hover:bg-rose-50 transition-colors`

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
        // Solid rose heart when favourited
        <svg className={`${dim} text-rose-500`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
        </svg>
      ) : (
        // Outlined heart when not favourited
        <svg className={`${dim} text-slate-400 hover:text-rose-400 transition-colors`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
        </svg>
      )}
    </button>
  )
}
