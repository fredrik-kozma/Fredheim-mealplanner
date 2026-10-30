import { useState, useRef, useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

// Whether the tips are folded open, remembered per device.
const OPEN_KEY = 'fredheim_week_tips_open'

function initiallyOpen() {
  try {
    const saved = localStorage.getItem(OPEN_KEY)
    if (saved === '1') return true
    if (saved === '0') return false
  } catch { /* private mode */ }
  // A generated week's tips run to a whole screen on a phone and push the
  // week itself out of sight, so phones start folded.
  return !(typeof window !== 'undefined' && window.matchMedia?.('(max-width: 639px)').matches)
}

/**
 * The week-level "Smart tips" card that sits above the planner grid —
 * batch-prep guidance that applies to the whole week ("bake the bread on
 * Monday, it covers the week").
 *
 * Collapses to a single faint button when empty so it costs nothing on
 * weeks that don't use it. With tips in it, it folds to its first line
 * (closed by default on phones). Styled to match the recipe detail's
 * Chef's notes card (amber), since it plays the same role.
 */
export default function WeekNotes() {
  const { t } = useTranslation()
  const weekNotes = useStore(s => s.weekNotes)
  const setWeekNote = useStore(s => s.setWeekNote)

  const text = weekNotes?.week || ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const [open, setOpen] = useState(initiallyOpen)
  const areaRef = useRef(null)
  const bodyId = useId()

  function toggleOpen() {
    const next = !open
    setOpen(next)
    try { localStorage.setItem(OPEN_KEY, next ? '1' : '0') } catch { /* private mode */ }
  }
  const expanded = open || editing

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
        <div className={`flex items-center justify-between gap-2 ${expanded ? 'mb-1.5' : 'mb-0.5'}`}>
          <button
            type="button"
            onClick={toggleOpen}
            disabled={editing}
            aria-expanded={expanded}
            aria-controls={bodyId}
            className="text-xs font-bold text-amber-900 inline-flex items-center gap-1.5 -my-1 py-1"
          >
            <span aria-hidden>💡</span>
            {t('planner.weekNotesTitle', { defaultValue: 'Smart tips' })}
            {!editing && (
              <svg
                className={`w-3.5 h-3.5 text-amber-700 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </button>
          {!editing && expanded && (
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
        ) : expanded ? (
          <p id={bodyId} className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{text}</p>
        ) : (
          // Folded: the first line still shows (it is usually the "talk to
          // your doctor" note), and tapping it unfolds the rest.
          <button
            type="button"
            id={bodyId}
            onClick={toggleOpen}
            className="block w-full text-left text-sm text-amber-900/80 leading-relaxed line-clamp-1"
          >
            {text}
          </button>
        )}
      </div>
    </div>
  )
}
