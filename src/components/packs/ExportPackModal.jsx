import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

// ── Helpers ────────────────────────────────────────────────────────────────

function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Tag input ──────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder, hint }) {
  const [input, setInput] = useState('')

  function addTag(raw) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag))
  }

  return (
    <div className="min-h-[42px] w-full rounded-xl border border-slate-200 px-2.5 py-1.5 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all duration-150 bg-white">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-lg">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none py-0.5"
      />
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────

export default function ExportPackModal({ onClose }) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const titleOf = (r) => r.translations?.[currentLang]?.title || r.title
  const recipes = useStore(s => s.recipes)
  const recipeCategories = useStore(s => s.recipeCategories)

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedIds, setSelectedIds] = useState(new Set())

  const [packName, setPackName] = useState('')
  const [packId, setPackId] = useState('')
  const [packIdManual, setPackIdManual] = useState(false)
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [tags, setTags] = useState([])

  const categories = useMemo(() => {
    const used = recipeCategories.filter(c => recipes.some(r => r.category === c))
    return ['All', ...used]
  }, [recipes, recipeCategories])

  const filtered = useMemo(() => recipes
    .filter(r => activeCategory === 'All' || r.category === activeCategory)
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return titleOf(r).toLowerCase().includes(q) || r.title.toLowerCase().includes(q)
    })
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b))),
    [recipes, activeCategory, search, currentLang]
  )

  function handleNameChange(val) {
    setPackName(val)
    if (!packIdManual) {
      setPackId(toSlug(val))
    }
  }

  function handlePackIdChange(val) {
    setPackId(val)
    setPackIdManual(true)
  }

  function toggleRecipe(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map(r => r.id)))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  const canExport = selectedIds.size > 0 && packName.trim() !== '' && packId.trim() !== ''

  function handleExport() {
    if (!canExport) return

    const selectedRecipes = recipes
      .filter(r => selectedIds.has(r.id))
      .map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        servings: r.servings,
        prepTime: r.prepTime ?? null,
        cookTime: r.cookTime ?? null,
        imageUrl: r.imageUrl ?? null,
        description: r.description ?? '',
        tags: r.tags ?? [],
        kcal: r.kcal ?? null,
        ingredients: r.ingredients ?? [],
        steps: r.steps ?? [],
        translations: r.translations ?? {},
      }))

    const pack = {
      id: packId.trim(),
      name: packName.trim(),
      description: description.trim(),
      author: author.trim(),
      version: version.trim() || '1.0.0',
      tags,
      recipes: selectedRecipes,
    }

    downloadJson(pack, `${packId.trim()}.json`)
  }

  const CATEGORY_COLORS = {
    Breakfast: 'bg-amber-50 text-amber-700',
    Lunch: 'bg-emerald-50 text-emerald-700',
    Dinner: 'bg-indigo-50 text-indigo-700',
    Snack: 'bg-orange-50 text-orange-700',
    Dessert: 'bg-pink-50 text-pink-700',
    Bread: 'bg-yellow-50 text-yellow-700',
    Porridge: 'bg-amber-50 text-amber-700',
    Supper: 'bg-violet-50 text-violet-700',
    Spreads: 'bg-lime-50 text-lime-700',
    Other: 'bg-slate-100 text-slate-500',
  }

  function categoryColor(cat) {
    return CATEGORY_COLORS[cat] ?? 'bg-slate-100 text-slate-500'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90dvh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-slate-900">{t('exportPack.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Section 1: Select Recipes ─────────────────────────────── */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                {t('exportPack.step1')}
              </h3>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {t('exportPack.selected', { count: selectedIds.size })}
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="search"
                placeholder={t('exportPack.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none mb-3" style={{ scrollbarWidth: 'none' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {cat === 'All' ? t('recipes.allCategories') : t(`categories.${cat}`, { defaultValue: cat })}
                </button>
              ))}
            </div>

            {/* Select / Deselect all */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={selectAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                {t('exportPack.selectAll')}
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={deselectAll}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                {t('exportPack.deselectAll')}
              </button>
            </div>

            {/* Recipe list */}
            <div className="space-y-1 max-h-56 overflow-y-auto -mx-1 px-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">{t('exportPack.noMatch')}</p>
              ) : (
                filtered.map(recipe => {
                  const checked = selectedIds.has(recipe.id)
                  return (
                    <label
                      key={recipe.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        checked ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipe(recipe.id)}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 flex-shrink-0"
                      />
                      <span className="flex-1 text-sm font-medium text-slate-800 truncate">{titleOf(recipe)}</span>
                      <span className={`badge text-xs flex-shrink-0 ${categoryColor(recipe.category)}`}>
                        {t(`categories.${recipe.category}`, { defaultValue: recipe.category })}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {t('exportPack.servings', { count: recipe.servings })}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Section 2: Pack Details ───────────────────────────────── */}
          <div className="px-5 pt-5 pb-6">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-4">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              {t('exportPack.step2')}
            </h3>

            <div className="space-y-4">
              {/* Pack Name */}
              <div>
                <label className="label">
                  {t('exportPack.packNameRequired')}
                </label>
                <input
                  type="text"
                  placeholder={t('exportPack.packNamePlaceholder')}
                  value={packName}
                  onChange={e => handleNameChange(e.target.value)}
                  className="input"
                />
              </div>

              {/* Pack ID */}
              <div>
                <label className="label">
                  {t('exportPack.packIdRequired')}
                  <span className="text-slate-400 font-normal ml-1">{t('exportPack.packIdNote')}</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder={t('exportPack.packIdPlaceholder')}
                    value={packId}
                    onChange={e => handlePackIdChange(e.target.value)}
                    className="input font-mono text-xs"
                  />
                  <span className="text-xs text-slate-400 flex-shrink-0 font-mono">.json</span>
                </div>
                {!packIdManual && packId && (
                  <p className="text-xs text-slate-400 mt-1">{t('exportPack.packIdAutoGenerated')}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="label">{t('exportPack.description')}</label>
                <textarea
                  placeholder={t('exportPack.descriptionPlaceholder')}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="input resize-none"
                />
              </div>

              {/* Author + Version row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t('exportPack.author')}</label>
                  <input
                    type="text"
                    placeholder={t('exportPack.authorPlaceholder')}
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">{t('exportPack.version')}</label>
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="label">{t('exportPack.tags')}</label>
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  placeholder={t('exportPack.tagsPlaceholder')}
                />
                <p className="text-xs text-slate-400 mt-1">{t('exportPack.tagsHint')}</p>
              </div>
            </div>

            {/* Info box */}
            <div className="mt-5 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 flex gap-3">
              <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-xs text-indigo-700 leading-relaxed">
                After downloading, upload <code className="bg-indigo-100 px-1 rounded font-mono">{packId || '{packId}'}.json</code> to your GitHub{' '}
                <code className="bg-indigo-100 px-1 rounded font-mono">menu-planner-recipes/packs/</code> folder and add an entry to{' '}
                <code className="bg-indigo-100 px-1 rounded font-mono">registry.json</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary">
            {t('exportPack.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            {selectedIds.size > 0
              ? (selectedIds.size === 1
                  ? t('exportPack.exportCount', { count: selectedIds.size })
                  : t('exportPack.exportCountPlural', { count: selectedIds.size }))
              : t('exportPack.exportPack')
            }
          </button>
        </div>
      </div>
    </div>
  )
}
