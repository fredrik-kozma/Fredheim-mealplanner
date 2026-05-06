import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import RecipeCard from './RecipeCard'

export default function RecipeList() {
  const { t, i18n } = useTranslation()
  const recipes = useStore(s => s.recipes)
  const recipeCategories = useStore(s => s.recipeCategories)
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const titleOf = (r) => r.translations?.[currentLang]?.title || r.title

  const filtered = recipes
    .filter(r => activeCategory === 'All' || r.category === activeCategory)
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return titleOf(r).toLowerCase().includes(q) || r.title.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt
      if (sortBy === 'oldest') return a.createdAt - b.createdAt
      if (sortBy === 'name') return titleOf(a).localeCompare(titleOf(b))
      return 0
    })

  const categories = ['All', ...recipeCategories.filter(c => recipes.some(r => r.category === c))]

  return (
    <div className="flex flex-col h-full">
      {/* Search + Sort bar */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              placeholder={t('recipes.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input w-auto pr-8 bg-white"
          >
            <option value="newest">{t('recipes.sort.newest')}</option>
            <option value="oldest">{t('recipes.sort.oldest')}</option>
            <option value="name">{t('recipes.sort.nameAZ')}</option>
          </select>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {cat === 'All' ? t('recipes.allCategories') : t(`categories.${cat}`, { defaultValue: cat })}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 lg:pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative flex mb-4" style={{ width: '4rem', height: '3.5rem' }}>
              <span className="text-5xl absolute left-0">🥑</span>
              <span className="text-5xl absolute left-6">🥑</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('recipes.noRecipesYet')}</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">
              {search ? t('recipes.noRecipesMatch') : t('recipes.addFirstRecipe')}
            </p>
            {!search && (
              <button onClick={() => navigate('/recipes/new')} className="btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('recipes.addRecipe')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
            {filtered.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
