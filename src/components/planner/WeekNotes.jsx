import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

/**
 * The week-level "Smart tips" card that sits above the planner grid —
 * batch-prep guidance that applies to the whole week ("bake the bread on
 * Monday, it covers the week").
 *
 * Collapses to a single faint button when empty so it costs nothing on
 * weeks that don't use it. Styled to match the recipe detail's Chef's
 * notes card (amber), since it plays the same role.
 */
export default function WeekNotes() {
  const { t } = useTranslation()
  const weekNotes = useStore(s => s.weekNotes)
  const setWeekNote = useStore(s => s.setWeekNote)

  const text = weekNotes?.week || ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const areaRef = useRef(null)

  // Keep the draft in sync when the week is swapped underneath us (loading
  // a saved week or a sample week while the card is open).
  useEffect(() => {
    if (!editing) setDraft(text)
  }, [text, editing])

  useEffect(() => {
    if (editing) areaRef.current?.focus()
  }, [editing])

  function commit() {
    setWeekNote(draft.trim())
    setEditing(false)
  }

  function cancel() {
    setDraft(text)
    setEditing(false)
  }

  if (!text && !editing) {
    return (
      <div className="px-4 pb-3">
        <button
          onClick={() => { setDraft(''); setEditing(true) }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/40 transition-colors text-xs font-medium"
        >
          <span aria-hidden>💡</span>
          {t('planner.addWeekNote', { defaultValue: 'Add smart tips for this week' })}
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pb-3">
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-xs font-bold text-amber-900 inline-flex items-center gap-1.5">
            <span aria-hidden>💡</span>
            {t('planner.weekNotesTitle', { defaultValue: 'Smart tips' })}
          </p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900"
            >
              {t('common.edit', { defaultValue: 'Edit' })}
            </button>
          )}
        </div>

        {editing ? (
          <div>
            <textarea
              ref={areaRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') cancel()
                // Enter commits; Shift+Enter adds a line, since these notes
                // are often several short bullets.
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
              }}
              rows={3}
              placeholder={t('planner.weekNotesPlaceholder', {
                defaultValue: 'e.g. Bake the bread on Monday — it covers the whole week. Soak the beans Sunday night.',
              })}
              className="w-full text-sm text-amber-900 bg-white/70 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-amber-400/70"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={cancel} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1">
                {t('common.cancel')}
              </button>
              <button onClick={commit} className="text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg px-3 py-1">
                {t('common.save')}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </div>
  )
}
