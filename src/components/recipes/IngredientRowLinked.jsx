/**
 * One ingredient row with qty, restricted units, dictionary picker, and note.
 * Replaces the plain IngredientRow inside RecipeForm (see patches/).
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import IngredientPicker from './IngredientPicker.jsx'
import UnitSelectRestricted from './UnitSelectRestricted.jsx'
import { allowedUnitsFor, suggestUnit } from '../../utils/allowedUnits.js'
import { dictionaryEntry } from '../../utils/ingredientDictionary.js'

export default function IngredientRowLinked({
  ing,
  onChange,
  onRemove,
  dictionary,
  nutritionFood, // nutritionDb.foods[id] or null
  onRequestMissing,
}) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'en').slice(0, 2)
  const entry = ing.ingredient ? dictionaryEntry(ing.ingredient, dictionary) : null
  const allowed = useMemo(
    () => (entry ? allowedUnitsFor(entry, nutritionFood) : null),
    [entry, nutritionFood],
  )

  function pick({ id, name, preferredUnit }) {
    const e = dictionaryEntry(id, dictionary)
    const unit = ing.unit && allowedUnitsFor(e, nutritionFood).includes(ing.unit)
      ? ing.unit
      : suggestUnit(e, nutritionFood) || preferredUnit || 'g'
    onChange({
      ...ing,
      ingredient: id,
      name,
      unit,
      // keep existing note
      notInDb: undefined,
    })
  }

  function freeText(name) {
    // Strip id only when the typed text no longer matches the linked standard name
    if (ing.ingredient && entry) {
      const std = entry.names?.[lang] || entry.names?.en
      if (std && name.trim().toLowerCase() === std.toLowerCase()) {
        onChange({ ...ing, name })
        return
      }
    }
    const { ingredient: _id, notInDb: _n, ...rest } = ing
    onChange({ ...rest, name, notInDb: true })
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 items-center">
        <input
          className="input w-20 flex-shrink-0"
          placeholder={t('recipeForm.ingredientQty')}
          value={ing.quantity || ''}
          onChange={(e) => onChange({ ...ing, quantity: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
          type="number"
          min="0"
          step="any"
        />
        <UnitSelectRestricted
          value={ing.unit || ''}
          allowedUnits={allowed}
          onChange={(u) => onChange({ ...ing, unit: u })}
        />
        <IngredientPicker
          value={ing.name || ''}
          selectedId={ing.ingredient || null}
          dictionary={dictionary}
          onPick={pick}
          onFreeText={freeText}
        />
        <button
          type="button"
          onClick={onRemove}
          className="btn-ghost p-2 text-slate-400 hover:text-red-500"
          aria-label={t('recipeForm.removeIngredient', { defaultValue: 'Remove' })}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 items-center pl-0 sm:pl-[5.5rem]">
        <input
          className="input flex-1 text-xs py-1.5"
          placeholder={t('recipeForm.ingredientNotePlaceholder')}
          value={ing.note || ''}
          onChange={(e) => onChange({ ...ing, note: e.target.value })}
        />
        {(ing.notInDb || (!ing.ingredient && ing.name)) && (
          <button
            type="button"
            className="text-xs text-indigo-600 whitespace-nowrap px-1"
            onClick={() => onRequestMissing?.(ing.name)}
          >
            {t('recipeForm.tellUsMissing')}
          </button>
        )}
      </div>
      {(ing.notInDb || (!ing.ingredient && ing.name)) && (
        <p className="text-xs text-amber-700 pl-0 sm:pl-[5.5rem]">
          {t('recipeForm.notInDatabaseHint')}
        </p>
      )}
    </div>
  )
}
