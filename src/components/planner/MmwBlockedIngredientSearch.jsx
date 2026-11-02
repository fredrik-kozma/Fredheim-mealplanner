import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dictionary from '../../data/ingredientDictionary.json'
import { COMPOSITE_CONTAINS } from '../../data/ingredientBlocker'
import {
  buildIngredientIndex,
  searchIngredients,
} from '../../utils/ingredientSearch'

const index = buildIngredientIndex(dictionary)

function entryLabel(id, lang) {
  const e = dictionary.entries.find((x) => x.id === id)
  if (!e) return id
  return e.names?.[lang] || e.names?.en || id
}

/**
 * Search + chips for specific ingredients to avoid in Make my week.
 * Controlled: blockedIds / onChange — parent owns draft state (synced to
 * global blockedIngredients on "Use this week").
 */
export default function MmwBlockedIngredientSearch({ blockedIds = [], onChange }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'en').slice(0, 2)
  const [q, setQ] = useState('')
  const ids = Array.isArray(blockedIds) ? blockedIds : []

  const results = useMemo(() => {
    if (!q.trim()) return []
    return searchIngredients(index, q, lang, 8).filter((r) => !ids.includes(r.id))
  }, [q, lang, ids])

  function add(id) {
    if (!id || ids.includes(id)) return
    onChange([...ids, id])
    setQ('')
  }
  function remove(id) {
    onChange(ids.filter((x) => x !== id))
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-slate-800 mb-1">
        {t('makeMyWeek.avoidIngredients')}
      </p>
      <p className="text-2xs text-slate-500 mb-2 leading-relaxed">
        {t('makeMyWeek.avoidIngredientsHint')}
      </p>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('settings.allergensSearch')}
        className="input w-full mb-2"
        autoComplete="off"
      />
      {results.length > 0 && (
        <ul className="border border-slate-200 rounded-control divide-y divide-slate-100 mb-3 overflow-hidden">
          {results.map((r) => {
            const contains = Object.entries(COMPOSITE_CONTAINS)
              .filter(([, parts]) => parts.includes(r.id))
              .map(([comp]) => comp)
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                  onClick={() => add(r.id)}
                >
                  <span className="min-w-0">
                    <span className="font-medium text-slate-800">{r.label}</span>
                    {contains.length > 0 && (
                      <span className="block text-2xs text-slate-500">
                        {t('settings.containsHint', {
                          name: entryLabel(contains[0], lang),
                          defaultValue: `Used in ${contains.join(', ')}`,
                        })}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary-700 bg-primary-50 rounded-small px-2 py-0.5">
                    {t('settings.allergensBlock')}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {ids.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => remove(id)}
              className="chip-danger"
              aria-label={t('makeMyWeek.removeAvoidIngredient', {
                name: entryLabel(id, lang),
                defaultValue: `Remove ${entryLabel(id, lang)}`,
              })}
            >
              <span>{entryLabel(id, lang)}</span>
              <span aria-hidden className="ml-1">✕</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
