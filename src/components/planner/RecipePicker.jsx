import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

export default function RecipePicker({ onSelect, onClose, title }) {
  const { t, i18n } = useTranslation()
  const recipes = useStore(s => s.recipes)
  const recipeCategories = useStore(s => s.recipeCategories)
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const titleOf = (r) => r.translations?.[currentLang]?.title || r.title
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

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

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pt-2 pb-5" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'All' ? t('recipes.allCategories') : t(`categories.${cat}`, { defaultValue: cat })}
            </button>
          ))}
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
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
