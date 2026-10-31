import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useStore from '../../store/useStore'
import EditableNumber from '../common/EditableNumber'

/**
 * The week's batch-cooking column, pinned to the left of the planner grid —
 * the things you prep once to cover several days (bouillon, bread, spreads).
 *
 * Recipe entries feed the shopping list at their batch servings. Text entries
 * are plain reminders and buy nothing. Meals on the days that this prep covers
 * get switched off individually via the chip toggle in MealSlot, so they show
 * in the plan without being bought twice.
 */

function BatchRecipeChip({ entry, recipe, currentLang }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const familySize = useStore(s => s.familySize)
  const setBatchServings = useStore(s => s.setBatchServings)
  const removeBatchItem = useStore(s => s.removeBatchItem)
  const [showAdjuster, setShowAdjuster] = useState(false)

  const effectiveServings = entry.servings ?? familySize ?? 4
  const isOverridden = entry.servings != null

  return (
    <div className="group bg-white rounded-small shadow-card border border-slate-100 hover:border-orange-200 transition-colors">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt="" className="w-6 h-6 rounded-small object-cover flex-shrink-0" />
        ) : (
          <span className="text-sm flex-shrink-0">🍽</span>
        )}
        <button
          onClick={() => navigate(`/recipes/${entry.recipeId}`, { state: { from: '/planner' } })}
          className="tap-target text-xs font-medium text-slate-700 flex-1 leading-tight line-clamp-2 text-left hover:text-orange-700"
        >
          {recipe.translations?.[currentLang]?.title || recipe.title}
        </button>
        <button
          onClick={() => removeBatchItem(entry.id)}
          className="tap-target text-slate-400 hover:text-danger-500 transition-colors flex-shrink-0"
          title={t('common.remove')}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-2 pb-1.5 -mt-0.5">
        {showAdjuster ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBatchServings(entry.id, Math.max(1, effectiveServings - 1))}
              disabled={effectiveServings <= 1}
              className="tap-target w-6 h-6 rounded-small bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold flex items-center justify-center"
            >
              −
            </button>
            <EditableNumber
              value={effectiveServings}
              onChange={(n) => setBatchServings(entry.id, n)}
              min={1}
              className="flex-1 w-8 text-center text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-small py-0.5"
              aria-label={t('planner.adjustServings', { defaultValue: 'Adjust servings' })}
            />
            <button
              onClick={() => setBatchServings(entry.id, effectiveServings + 1)}
              className="tap-target w-6 h-6 rounded-small bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center"
            >
              +
            </button>
            <button onClick={() => setShowAdjuster(false)} className="tap-target text-slate-300 hover:text-slate-500 ml-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdjuster(true)}
            className={`tap-target text-2xs px-1.5 py-0.5 rounded-full font-medium transition-colors ${
              isOverridden
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
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

function BatchTextChip({ entry }) {
  const { t } = useTranslation()
  const updateBatchText = useStore(s => s.updateBatchText)
  const removeBatchItem = useStore(s => s.removeBatchItem)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.text)
  const ref = useRef(null)

  useEffect(() => { if (!editing) setDraft(entry.text) }, [entry.text, editing])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  function commit() {
    const clean = draft.trim()
    // Emptying a reminder removes it, rather than leaving a blank chip.
    if (!clean) removeBatchItem(entry.id)
    else updateBatchText(entry.id, clean)
    setEditing(false)
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Escape') { setDraft(entry.text); setEditing(false) }
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
        }}
        rows={2}
        className="w-full text-xs text-orange-900 bg-white border border-orange-300 rounded-small px-2 py-1.5 leading-snug resize-none"
      />
    )
  }

  return (
    <div className="group flex items-start gap-1.5 bg-white/80 rounded-small border border-dashed border-orange-200 px-2 py-1.5">
      <span className="text-xs flex-shrink-0 leading-tight">📝</span>
      <button
        onClick={() => setEditing(true)}
        className="tap-target text-xs text-slate-600 flex-1 leading-snug text-left break-words hover:text-orange-700"
      >
        {entry.text}
      </button>
      <button
        onClick={() => removeBatchItem(entry.id)}
        className="tap-target text-slate-300 hover:text-danger-500 transition-colors flex-shrink-0"
        title={t('common.remove')}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function BatchCookColumn({ onAddRecipe }) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const batchCook = useStore(s => s.batchCook) || []
  const recipes = useStore(s => s.recipes)
  const addBatchText = useStore(s => s.addBatchText)

  const [addingText, setAddingText] = useState(false)
  const [textDraft, setTextDraft] = useState('')
  // On a phone the full column plus the row labels take most of the
  // screen before Monday even starts, so there it opens folded into a
  // narrow strip. From sm up it is always open and the toggle is hidden.
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 639px)').matches
  )
  const textRef = useRef(null)

  useEffect(() => { if (addingText) textRef.current?.focus() }, [addingText])

  function commitText() {
    if (textDraft.trim()) addBatchText(textDraft)
    setTextDraft('')
    setAddingText(false)
  }

  const batchLabel = t('planner.batchCook', { defaultValue: 'Batch cooking' })

  return (
    <>
    {/* Folded strip — phones only. */}
    {collapsed && (
      <button
        onClick={() => setCollapsed(false)}
        className="tap-target sm:hidden flex-shrink-0 w-10 flex flex-col items-center gap-2 py-2 rounded-control bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
        title={t('planner.batchShow', { defaultValue: 'Show batch cooking' })}
        aria-label={t('planner.batchShow', { defaultValue: 'Show batch cooking' })}
        aria-expanded={false}
      >
        <span aria-hidden>🍲</span>
        {batchCook.length > 0 && (
          <span className="text-2xs font-bold bg-white/80 rounded-full px-1.5">{batchCook.length}</span>
        )}
        <span className="text-xs font-semibold [writing-mode:vertical-rl]">{batchLabel}</span>
      </button>
    )}
    <div className={`flex-shrink-0 w-40 sm:w-44 flex-col gap-2 ${collapsed ? 'hidden sm:flex' : 'flex'}`}>
      {/* Header — matches the day-header height so the column tops align.
          The right padding on phones leaves room for the fold button. */}
      <div className="relative text-center py-2 px-6 sm:px-0 rounded-control font-semibold text-sm bg-orange-100 text-orange-800">
        <span className="inline-flex items-center gap-1">
          <span aria-hidden>🍲</span>
          {batchLabel}
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="tap-target sm:hidden absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-orange-700/70 hover:text-orange-900"
          title={t('planner.batchHide', { defaultValue: 'Hide batch cooking' })}
          aria-label={t('planner.batchHide', { defaultValue: 'Hide batch cooking' })}
          aria-expanded={true}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <div className="flex-1 min-h-[120px] rounded-control border border-orange-100 bg-orange-50/60 p-2">
        <p className="text-2xs leading-snug text-orange-700/70 px-0.5 pb-1.5">
          {t('planner.batchCookHint', { defaultValue: 'Prep once for the week. Counted in the shopping list.' })}
        </p>

        <div className="space-y-1.5">
          {batchCook.map(entry => {
            if (entry.kind === 'text') return <BatchTextChip key={entry.id} entry={entry} />
            const recipe = recipes.find(r => r.id === entry.recipeId)
            if (!recipe) return null
            return (
              <BatchRecipeChip key={entry.id} entry={entry} recipe={recipe} currentLang={currentLang} />
            )
          })}
        </div>

        {addingText && (
          <textarea
            ref={textRef}
            value={textDraft}
            onChange={e => setTextDraft(e.target.value)}
            onBlur={commitText}
            onKeyDown={e => {
              if (e.key === 'Escape') { setTextDraft(''); setAddingText(false) }
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText() }
            }}
            rows={2}
            placeholder={t('planner.batchTextPlaceholder', { defaultValue: 'e.g. double batch of tomato sauce' })}
            className="mt-1.5 w-full text-xs text-orange-900 bg-white border border-orange-300 rounded-small px-2 py-1.5 leading-snug resize-none placeholder:text-orange-400/70"
          />
        )}

        <button
          onClick={onAddRecipe}
          className="tap-target mt-1.5 w-full flex items-center justify-center gap-1 py-1 rounded-small text-xs text-orange-500 hover:text-orange-700 hover:bg-white/80 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('planner.addRecipe', { defaultValue: 'Recipe' })}
        </button>
        <button
          onClick={() => setAddingText(true)}
          className="tap-target w-full flex items-center justify-center gap-1 py-1 rounded-small text-xs text-slate-400 hover:text-orange-700 hover:bg-white/80 transition-colors"
        >
          <span aria-hidden>📝</span>
          {t('planner.addNote', { defaultValue: 'Note' })}
        </button>
      </div>
    </div>
    </>
  )
}
