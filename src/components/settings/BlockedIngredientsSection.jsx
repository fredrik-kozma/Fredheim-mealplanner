import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import {
  BLOCK_GROUPS,
  PER_NUT_IDS,
  COMPOSITE_CONTAINS,
  normalizeBlocked,
} from '../../data/ingredientBlocker'
import dictionary from '../../data/ingredientDictionary.json'
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

export default function BlockedIngredientsSection() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'en').slice(0, 2)
  const blockedIngredients = useStore((s) => s.blockedIngredients) || { groups: [], ids: [] }
  const toggleBlockedGroup = useStore((s) => s.toggleBlockedGroup)
  const toggleBlockedId = useStore((s) => s.toggleBlockedId)
  const clearBlockedIngredients = useStore((s) => s.clearBlockedIngredients)
  const b = normalizeBlocked(blockedIngredients)

  const [q, setQ] = useState('')
  const results = useMemo(() => {
    if (!q.trim()) return []
    return searchIngredients(index, q, lang, 8).filter((r) => !b.ids.includes(r.id))
  }, [q, lang, b.ids])

  const activeNotes = BLOCK_GROUPS.filter(
    (g) => g.noteKey && b.groups.includes(g.id),
  )

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        {t('settings.allergensDesc')}
      </p>

      <p className="text-sm font-semibold text-slate-800 mb-1">
        {t('settings.allergensSearch')}
      </p>
      <p className="text-2xs text-slate-500 mb-2">
        {t('settings.allergensSearchHint')}
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
                  onClick={() => {
                    toggleBlockedId(r.id)
                    setQ('')
                  }}
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

      <p className="text-sm font-semibold text-slate-800 mb-2">
        {t('settings.allergensGroups')}
      </p>
      <div className="flex flex-wrap gap-2">
        {BLOCK_GROUPS.map((a) => {
          const on = b.groups.includes(a.id)
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleBlockedGroup(a.id)}
              aria-pressed={on}
              className={on ? 'chip-danger' : 'chip'}
            >
              <span aria-hidden>{on ? '✓' : a.icon}</span>
              {t(`allergens.${a.id}`, { defaultValue: a.id })}
            </button>
          )
        })}
      </div>

      {b.groups.includes('tree-nuts') && (
        <div className="mt-3">
          <p className="text-2xs font-medium text-slate-600 mb-1.5">
            {t('settings.perNut')}
          </p>
          <div className="flex flex-wrap gap-2">
            {PER_NUT_IDS.map((id) => {
              const on = b.ids.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleBlockedId(id)}
                  aria-pressed={on}
                  className={on ? 'chip-danger' : 'chip'}
                >
                  {entryLabel(id, lang)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeNotes.map((g) => (
        <p
          key={g.id}
          className="text-2xs text-slate-600 bg-slate-50 border border-slate-200 rounded-small px-3 py-2 mt-3 leading-relaxed"
        >
          {t(g.noteKey)}
        </p>
      ))}

      {(b.groups.length > 0 || b.ids.length > 0) && (
        <>
          <p className="text-sm font-semibold text-slate-800 mt-4 mb-2">
            {t('settings.allergensBlocked')}
          </p>
          <ul className="space-y-2 mb-3">
            {b.groups.map((g) => {
              const meta = BLOCK_GROUPS.find((x) => x.id === g)
              return (
                <li
                  key={`g-${g}`}
                  className="flex items-center gap-2 border border-danger-200 bg-white rounded-control px-3 py-2"
                >
                  <span aria-hidden>{meta?.icon || '🚫'}</span>
                  <span className="flex-1 text-sm font-medium">
                    {t(`allergens.${g}`, { defaultValue: g })}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost btn-sm text-danger-700"
                    onClick={() => toggleBlockedGroup(g)}
                    aria-label={t('settings.allergensClear')}
                  >
                    ✕
                  </button>
                </li>
              )
            })}
            {b.ids.map((id) => (
              <li
                key={`i-${id}`}
                className="flex items-center gap-2 border border-danger-200 bg-white rounded-control px-3 py-2"
              >
                <span className="flex-1 text-sm font-medium">{entryLabel(id, lang)}</span>
                <button
                  type="button"
                  className="btn-ghost btn-sm text-danger-700"
                  onClick={() => toggleBlockedId(id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={clearBlockedIngredients}
            className="btn-ghost btn-sm"
          >
            {t('settings.allergensClear')}
          </button>
        </>
      )}

      <p className="text-2xs text-warning-700 bg-warning-50 border border-warning-200 rounded-small px-3 py-2 mt-3 leading-relaxed">
        ⚠ {t('settings.allergensWarning')}
      </p>
    </div>
  )
}
