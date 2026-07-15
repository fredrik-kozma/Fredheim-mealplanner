import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import RecipeCard from './RecipeCard'
import { CONDITION_TAGS, CONDITION_CHIP_ACTIVE } from '../../data/conditionTags'

export default function RecipeList() {
  const { t, i18n } = useTranslation()
  const recipes = useStore(s => s.recipes)
  const recipeCategories = useStore(s => s.recipeCategories)
  const installedPacks = useStore(s => s.installedPacks)
  const favoriteRecipes = useStore(s => s.favoriteRecipes)
  const navigate = useNavigate()

  // Local-only toggle for "show only my favorites". Not persisted because
  // it's a fleeting browsing intent, not a long-term preference.
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const favSet = useMemo(() => new Set(favoriteRecipes || []), [favoriteRecipes])

  // Filter / sort state lives in the Zustand store (persisted to
  // IndexedDB). This means: navigating to Settings / Packs / Planner /
  // Shopping / a recipe and back to the Recipes page keeps every filter
  // intact. Closing the browser and reopening it tomorrow also keeps
  // them — the user always lands where they left off.
  const view = useStore(s => s.recipesView)
  const setRecipesView = useStore(s => s.setRecipesView)
  const resetRecipesView = useStore(s => s.resetRecipesView)

  const activeCategory = view.category
  const activePack = view.pack
  const activeCondition = view.condition || 'All'
  const search = view.search
  const sortBy = view.sortBy

  const setActiveCategory = (v) => setRecipesView({ category: v })
  const setActivePack = (v) => setRecipesView({ pack: v })
  const setActiveCondition = (v) => setRecipesView({ condition: v })
  const setSearch = (v) => setRecipesView({ search: v })
  const setSortBy = (v) => setRecipesView({ sortBy: v })


  // True if anything is filtered away from the default state — used to
  // decide whether to show the "Clear filters" pill.
  const hasActiveFilters =
    activeCategory !== 'All' ||
    activePack !== 'All' ||
    activeCondition !== 'All' ||
    search !== '' ||
    sortBy !== 'newest'

  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const titleOf = (r) => r.translations?.[currentLang]?.title || r.title

  // Build the pack dropdown options — only show packs that have at least
  // one installed recipe (and add a "My recipes" bucket for non-pack ones).
  const packOptions = useMemo(() => {
    const counts = {}
    let userRecipeCount = 0
    for (const r of recipes) {
      if (r.sourcePackId) counts[r.sourcePackId] = (counts[r.sourcePackId] || 0) + 1
      else userRecipeCount++
    }
    const opts = []
    for (const [packId, info] of Object.entries(installedPacks || {})) {
      if (!counts[packId]) continue
      const pack = info
      const localized = pack?.translations?.[currentLang]?.name
      opts.push({
        id: packId,
        label: localized || pack?.name || packId,
        count: counts[packId],
      })
    }
    opts.sort((a, b) => a.label.localeCompare(b.label))
    if (userRecipeCount > 0) {
      opts.push({ id: '__user__', label: t('recipes.myRecipes', { defaultValue: 'My recipes' }), count: userRecipeCount })
    }
    return opts
  }, [recipes, installedPacks, currentLang, t])

  const filtered = recipes
    .filter(r => !favoritesOnly || favSet.has(r.id))
    .filter(r => activeCategory === 'All' || r.category === activeCategory)
    .filter(r => activeCondition === 'All' || (r.tags || []).includes(activeCondition))
    .filter(r => {
      if (activePack === 'All') return true
      if (activePack === '__user__') return !r.sourcePackId
      return r.sourcePackId === activePack
    })
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
      {/* Header area: search bar + clear-filters pill + filter chip strips.
          flex-shrink-0 locks this whole block so the recipe grid below
          can never push it up and compress the chip strips visually. */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 space-y-3">
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
          {/* Favorites-only toggle. Always rendered so users can find it;
              becomes rose-filled (heart) when active — matching the
              FavoriteStar heart used on cards and the detail header. */}
          <button
            onClick={() => setFavoritesOnly(v => !v)}
            className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
              favoritesOnly
                ? 'bg-rose-50 border-rose-300 text-rose-500'
                : 'bg-white border-slate-200 text-slate-400 hover:text-rose-400 hover:border-rose-200'
            }`}
            title={favoritesOnly
              ? t('favorites.showAll', { defaultValue: 'Show all recipes' })
              : t('favorites.showOnly', { defaultValue: 'Show favorites only' })}
            aria-pressed={favoritesOnly}
          >
            {favoritesOnly ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Clear-filters pill — only appears when something is filtered. */}
        {hasActiveFilters && (
          <button
            onClick={resetRecipesView}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors px-3 py-1 rounded-full"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            {t('recipes.clearFilters', { defaultValue: 'Clear filters' })}
          </button>
        )}

        {/* Pack filter — only shown when more than one bucket exists.
            Strict static styling: fixed h-7, always-on 1px border, no
            transitions, no auto-scroll. Tapping a chip only flips the
            colour, never moves anything. */}
        {packOptions.length > 1 && (
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            <button
              onClick={() => setActivePack('All')}
              className={`flex-shrink-0 h-7 px-3 inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap border ${
                activePack === 'All'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {t('recipes.allPacks', { defaultValue: 'All packs' })}
            </button>
            {packOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setActivePack(opt.id)}
                className={`flex-shrink-0 h-7 px-3 inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap border ${
                  activePack === opt.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {opt.label} <span className="opacity-60">&nbsp;· {opt.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Condition filter chips — filter recipes by health condition
            (diabetes, blood pressure, heart & cholesterol, weight loss). */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none flex-shrink-0"
          style={{ scrollbarWidth: 'none' }}
        >
          <button
            onClick={() => setActiveCondition('All')}
            className={`flex-shrink-0 h-7 px-3 inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap border ${
              activeCondition === 'All'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {t('conditions.all', { defaultValue: 'All conditions' })}
          </button>
          {CONDITION_TAGS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCondition(activeCondition === c.id ? 'All' : c.id)}
              className={`flex-shrink-0 h-7 px-3 inline-flex items-center gap-1 rounded-full text-xs font-medium whitespace-nowrap border ${
                activeCondition === c.id
                  ? `${CONDITION_CHIP_ACTIVE[c.color]} border-transparent`
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <span aria-hidden>{c.icon}</span>
              {t(`conditions.${c.id}`, { defaultValue: c.id })}
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 h-8 px-3.5 inline-flex items-center rounded-full text-sm font-medium whitespace-nowrap border ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200'
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
