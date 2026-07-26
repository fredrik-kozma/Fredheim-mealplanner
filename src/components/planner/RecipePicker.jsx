import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { CONDITION_TAGS, CONDITION_CHIP_ACTIVE } from '../../data/conditionTags'
import { isFmdRecipe } from '../../utils/recipeFlags'
import { recipeHasAvoidedAllergen } from '../../data/allergens'

export default function RecipePicker({ onSelect, onClose, title }) {
  const { t, i18n } = useTranslation()
  const recipes = useStore(s => s.recipes)
  const recipeCategories = useStore(s => s.recipeCategories)
  const installedPacks = useStore(s => s.installedPacks)
  const avoidedAllergens = useStore(s => s.avoidedAllergens) || []
  const allergenFilterPaused = useStore(s => s.allergenFilterPaused)
  const allergenActive = avoidedAllergens.length > 0 && !allergenFilterPaused
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const titleOf = (r) => r.translations?.[currentLang]?.title || r.title
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activePack, setActivePack] = useState('All')
  // Conditions AND-combined; empty = no filter.
  const [activeConditions, setActiveConditions] = useState([])
  const toggleCondition = (id) => setActiveConditions(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  // Build the pack options once per render — only show packs that actually
  // have installed recipes, plus a "My recipes" bucket for non-pack ones.
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
      const localized = info?.translations?.[currentLang]?.name
      opts.push({ id: packId, label: localized || info?.name || packId, count: counts[packId] })
    }
    opts.sort((a, b) => a.label.localeCompare(b.label))
    if (userRecipeCount > 0) {
      opts.push({ id: '__user__', label: t('recipes.myRecipes', { defaultValue: 'My recipes' }), count: userRecipeCount })
    }
    return opts
  }, [recipes, installedPacks, currentLang, t])

  const pickerTitle = title || t('recipePicker.title')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = recipes
    .filter(r => activeCategory === 'All' || r.category === activeCategory)
    .filter(r => activeConditions.every(c => (r.tags || []).includes(c)))
    // Allergen profile applies here too — you shouldn't be able to plan a
    // meal containing something the household avoids.
    .filter(r => !allergenActive || !recipeHasAvoidedAllergen(r, avoidedAllergens))
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

  const categories = ['All', ...recipeCategories.filter(c => recipes.some(r => r.category === c))]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{pickerTitle}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              placeholder={t('recipePicker.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Pack chips — only shown when more than one bucket exists.
            Strict static styling: explicit h-7, always-on 1px border with
            colour matching the chip background, no color transition, no
            auto-scroll. The chip should look pixel-identical in every
            state — only the colour changes when selected. */}
        {packOptions.length > 1 && (
          <div
            className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pt-1 pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            <button
              onClick={() => setActivePack('All')}
              className={`flex-shrink-0 h-7 px-3 inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap border ${
                activePack === 'All'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 text-slate-600 border-slate-100'
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
                    : 'bg-slate-100 text-slate-600 border-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Condition chips — filter by health condition, same set as the
            main recipes page so a guest can build their week filtered. */}
        <div
          className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pt-2 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <button
            onClick={() => setActiveConditions([])}
            className={`flex-shrink-0 h-7 px-3 inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap border ${
              activeConditions.length === 0
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-slate-100 text-slate-600 border-slate-100'
            }`}
          >
            {t('conditions.all', { defaultValue: 'All conditions' })}
          </button>
          {CONDITION_TAGS.map(c => {
            const on = activeConditions.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => toggleCondition(c.id)}
                aria-pressed={on}
                className={`flex-shrink-0 h-7 px-3 inline-flex items-center gap-1 rounded-full text-xs font-medium whitespace-nowrap border ${
                  on
                    ? `${CONDITION_CHIP_ACTIVE[c.color]} border-transparent`
                    : 'bg-slate-100 text-slate-600 border-slate-100'
                }`}
              >
                <span aria-hidden>{on ? '✓' : c.icon}</span>
                {t(`conditions.${c.id}`, { defaultValue: c.id })}
              </button>
            )
          })}
        </div>

        {/* Category chips */}
        <div
          className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pt-2 pb-5"
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 h-7 px-3 inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap border ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 text-slate-600 border-slate-100'
              }`}
            >
              {cat === 'All' ? t('recipes.allCategories') : t(`categories.${cat}`, { defaultValue: cat })}
            </button>
          ))}
        </div>

        {/* Recipe list — scrollbar-gutter: stable reserves the scrollbar's
            width even when the list doesn't overflow, so the chip strips
            above don't visually "shift" when the user changes filters and
            the result count crosses the overflow threshold. */}
        <div
          className="flex-1 overflow-y-auto px-4 pt-4 pb-4"
          style={{ scrollbarGutter: 'stable' }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-400">{t('recipePicker.noResults')}</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => { onSelect(recipe.id); onClose() }}
                  className="w-full text-left card p-3 hover:border-indigo-200 hover:shadow-md transition-all duration-150 flex items-center gap-3"
                >
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-xl">
                      🍽
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{titleOf(recipe)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t(`categories.${recipe.category}`, { defaultValue: recipe.category })} · {t('recipeDetail.servings', { count: recipe.servings })}
                    </p>
                    {/* Flag restricted fasting-diet meals so a day isn't built
                        on them by mistake. */}
                    {isFmdRecipe(recipe) && (
                      <span className="mt-1 inline-flex items-center gap-1 badge bg-amber-100 text-amber-800 text-[11px] font-semibold">
                        <span aria-hidden>⏳</span>
                        {t('recipes.fmdBadge', { defaultValue: 'Fasting day' })}
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
