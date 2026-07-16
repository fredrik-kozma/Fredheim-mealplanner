import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

/**
 * One cell of the planner's "Notes" row — a short free-text reminder tied
 * to a single day ("soak the beans tonight"). Sits in the same grid as the
 * meal slots so it lines up with its day column and scrolls with it.
 *
 * Renders as a faint dashed placeholder when empty, so an unused Notes row
 * stays visually quiet.
 */
export default function DayNote({ day }) {
  const { t } = useTranslation()
  const weekNotes = useStore(s => s.weekNotes)
  const setDayNote = useStore(s => s.setDayNote)

  const text = weekNotes?.days?.[day] || ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const areaRef = useRef(null)

  useEffect(() => {
    if (!editing) setDraft(text)
  }, [text, editing])

  useEffect(() => {
    if (editing) areaRef.current?.focus()
  }, [editing])

  function commit() {
    setDayNote(day, draft.trim())
    setEditing(false)
  }

  function cancel() {
    setDraft(text)
    setEditing(false)
  }

  if (editing) {
    return (
      <textarea
        ref={areaRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Escape') cancel()
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() }
        }}
        rows={2}
        placeholder={t('planner.dayNotePlaceholder', { defaultValue: 'Note…' })}
        className="w-full text-xs text-amber-900 bg-white border border-amber-300 rounded-lg px-2 py-1.5 leading-snug resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-amber-400/70"
      />
    )
  }

  if (!text) {
    return (
      <button
        onClick={() => setEditing(true)}
        title={t('planner.addDayNote', { defaultValue: 'Add a note for this day' })}
        className="w-full min-h-[32px] rounded-lg border border-dashed border-slate-200 text-slate-300 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50/40 transition-colors flex items-center justify-center"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title={text}
      className="w-full min-h-[32px] text-left rounded-lg bg-amber-50 border border-amber-100 hover:border-amber-300 transition-colors px-2 py-1.5"
    >
      <span className="block text-xs text-amber-900 leading-snug whitespace-pre-wrap break-words">{text}</span>
    </button>
  )
}
