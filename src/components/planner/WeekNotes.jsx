import { useState, useRef, useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

// Whether the tips are folded open, remembered per device once the user
// has toggled them. Until then the screen size decides.
const OPEN_KEY = 'fredheim_week_tips_open'
const PHONE_QUERY = '(max-width: 639px)'

function savedOpen() {
  try {
    const saved = localStorage.getItem(OPEN_KEY)
    if (saved === '1') return true
    if (saved === '0') return false
  } catch { /* private mode */ }
  return null
}

function isPhone() {
  return typeof window !== 'undefined' && !!window.matchMedia?.(PHONE_QUERY).matches
}

// A generated week's tips run to a whole screen on a phone and push the
// week itself out of sight, so phones start folded.
function initiallyOpen() {
  return savedOpen() ?? !isPhone()
}

/**
 * The week-level "Smart tips" card that sits above the planner grid —
 * batch-prep guidance that applies to the whole week ("bake the bread on
 * Monday, it covers the week").
 *
 * Collapses to a single faint button when empty so it costs nothing on
 * weeks that don't use it. With tips in it, the whole header row folds it
 * open and shut; folded, only the header shows, with the first line of
 * the tips after the title. Styled to match the recipe detail's Chef's
 * notes card (amber), since it plays the same role.
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

  // No choice saved yet: follow the screen across a resize or rotation.
  useEffect(() => {
    const mq = typeof window !== 'undefined' ? window.matchMedia?.(PHONE_QUERY) : null
    if (!mq?.addEventListener) return
    const onChange = e => { if (savedOpen() == null) setOpen(!e.matches) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

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
    // Show what was just written rather than folding it away. Not saved
    // as the device's choice: the user didn't toggle anything.
    setOpen(true)
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
          className="tap-target w-full flex items-center justify-center gap-2 py-2 rounded-control border border-dashed border-slate-200 text-slate-400 hover:border-warning-300 hover:text-warning-600 hover:bg-warning-50/40 transition-colors text-xs font-medium"
        >
          <span aria-hidden>💡</span>
          {t('planner.addWeekNote', { defaultValue: 'Add smart tips for this week' })}
        </button>
      </div>
    )
  }

  const summary = text.split('\n').find(line => line.trim())?.trim() || ''

  return (
    <div className="px-4 pb-3">
      <div className="rounded-control bg-warning-50 border border-warning-100">
        <button
          type="button"
          onClick={toggleOpen}
          disabled={editing}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="tap-target w-full min-h-[40px] flex items-center gap-2 px-4 py-2 text-left rounded-control disabled:cursor-default"
        >
          <span aria-hidden className="shrink-0 text-xs">💡</span>
          <span className="shrink-0 text-xs font-bold text-warning-900">
            {t('planner.weekNotesTitle', { defaultValue: 'Smart tips' })}
          </span>
          {/* Folded, the first line of the tips says what's inside. */}
          <span className="min-w-0 flex-1 truncate text-xs text-warning-900/70">
            {!expanded && summary}
          </span>
          {!editing && (
            <svg
              className={`shrink-0 w-4 h-4 text-warning-700 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          )}
        </button>

        <div id={bodyId} hidden={!expanded} className="px-4 pb-3">
          {editing ? (
            <>
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
                className="w-full text-sm text-warning-900 bg-white/70 border border-warning-200 rounded-small px-3 py-2 leading-relaxed resize-y placeholder:text-warning-400/70"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={cancel} className="tap-target text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1">
                  {t('common.cancel')}
                </button>
                <button onClick={commit} className="tap-target text-xs font-semibold text-white bg-warning-600 hover:bg-warning-700 rounded-small px-3 py-1">
                  {t('common.save')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-warning-900 leading-relaxed whitespace-pre-wrap">{text}</p>
              <div className="flex justify-end mt-1.5">
                <button
                  onClick={() => setEditing(true)}
                  className="tap-target text-2xs font-semibold text-warning-700 hover:text-warning-900 px-1 py-0.5"
                >
                  {t('common.edit', { defaultValue: 'Edit' })}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
