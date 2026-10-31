/**
 * Autocomplete dictionary picker for one ingredient row.
 * Mobile: full-width list directly under the input, capped height, stable gutter.
 * Keeps dictionary id when the user picks; free-text fallback is marked notInDb.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemo as useMemoIndex } from 'react'
import { buildIngredientIndex, searchIngredients } from '../../utils/ingredientSearch.js'

export default function IngredientPicker({
  value = '',
  selectedId = null,
  dictionary,   // optional; defaults to app dictionary via lazy require pattern below
  onPick,       // ({ id, name, preferredUnit }) => void
  onFreeText,   // (name) => void  — unmatched / cleared id
  placeholder,
  disabled = false,
  className = '',
}) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'en').slice(0, 2)
  const listId = useId()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [active, setActive] = useState(0)
  const [fallbackDict, setFallbackDict] = useState(null)

  useEffect(() => {
    if (dictionary) return
    let cancelled = false
    import('../../data/ingredientDictionary.json')
      .then((m) => { if (!cancelled) setFallbackDict(m.default || m) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [dictionary])

  const index = useMemo(
    () => buildIngredientIndex(dictionary || fallbackDict || { entries: [] }),
    [dictionary, fallbackDict],
  )

  useEffect(() => { setQuery(value) }, [value])

  const results = useMemo(
    () => (open ? searchIngredients(index, query, lang, 10) : []),
    [open, query, lang, index],
  )

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function commitPick(item) {
    onPick?.({
      id: item.id,
      name: item.names?.[lang] || item.label,
      preferredUnit: item.preferredUnit,
    })
    setQuery(item.names?.[lang] || item.label)
    setOpen(false)
  }

  function commitFree(text) {
    const name = String(text || '').trim()
    onFreeText?.(name)
    setQuery(name)
    setOpen(false)
  }

  function onKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) commitPick(results[active])
      else commitFree(query)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const linked = Boolean(selectedId)

  return (
    <div ref={rootRef} className={`relative flex-1 min-w-0 ${className}`}>
      <input
        ref={inputRef}
        className={`input w-full ${linked ? 'pr-8' : ''}`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
        placeholder={placeholder || t('recipeForm.ingredientName')}
        value={query}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => {
          const v = e.target.value
          setQuery(v)
          setOpen(true)
          // Typing freely — clear id until they pick again
          onFreeText?.(v)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {linked && (
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600"
          title={t('recipeForm.linkedToDatabase')}
          aria-hidden
        >
          ✓
        </span>
      )}
      {!linked && query.trim() && (
        <span className="sr-only">{t('recipeForm.notInDatabase')}</span>
      )}

      {open && (query.trim() || results.length > 0) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
          style={{ scrollbarGutter: 'stable' }}
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-slate-500">
              {t('recipeForm.noIngredientMatch')}
              <button
                type="button"
                className="mt-1 block text-indigo-600 font-medium"
                onClick={() => commitFree(query)}
              >
                {t('recipeForm.useAsTyped', { name: query.trim() })}
              </button>
            </li>
          ) : (
            results.map((item, i) => (
              <li
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={i === active}
                className={`px-3 py-2.5 text-sm cursor-pointer ${
                  i === active ? 'bg-indigo-50 text-indigo-900' : 'text-slate-800 hover:bg-slate-50'
                }`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commitPick(item)
                }}
              >
                <div className="font-medium">{item.label}</div>
                {item.matchText && item.matchText !== item.label && (
                  <div className="text-xs text-slate-500">{item.matchText}</div>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
