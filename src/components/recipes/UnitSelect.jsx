import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { CANONICAL_UNITS, displayUnit, normalizeUnit, getUnitOptions } from '../../utils/unitNormalizer'

// Unit dropdown used in the recipe form.
//
// - `value` stores the canonical key ('tbsp', 'g', …) or a raw custom-unit
//   string. Legacy free-text values are normalized on read so old recipes
//   render the right option as selected.
// - Options are grouped (Weight / Volume / Count) with the user's preferred
//   system (metric | us) shown first and the other system available after.
// - Custom units added in Settings appear in their own group at the bottom.
export default function UnitSelect({ value, onChange, className = '' }) {
  const { t, i18n } = useTranslation()
  const unitSystem = useStore(s => s.units)
  const customUnits = useStore(s => s.customUnits)
  const lang = i18n.language || 'en'

  const { groups, order } = getUnitOptions(unitSystem, customUnits)

  // Resolve the currently selected value. If the stored unit is a legacy
  // alias ('ss', 'ts', 'msk', 'stk', …) we normalize to its canonical key so
  // the <select> highlights the correct option.
  const normalized = value ? normalizeUnit(value) : ''
  const selectValue = CANONICAL_UNITS[normalized]
    ? normalized
    : customUnits.includes(value)
      ? value
      : normalized || value || ''

  const groupLabels = {
    weight: t('units.groupWeight'),
    volume: t('units.groupVolume'),
    count: t('units.groupCount'),
  }

  return (
    <select
      className={`input w-24 flex-shrink-0 ${className}`}
      value={selectValue}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">{t('units.none')}</option>

      {order.map(groupKey => {
        const group = groups[groupKey]
        const keys = [...group.preferred, ...group.other]
        if (keys.length === 0) return null
        return (
          <optgroup key={groupKey} label={groupLabels[groupKey]}>
            {keys.map(key => (
              <option key={key} value={key}>
                {displayUnit(key, lang)}
              </option>
            ))}
          </optgroup>
        )
      })}

      {customUnits.length > 0 && (
        <optgroup label={t('units.groupCustom')}>
          {customUnits.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </optgroup>
      )}
    </select>
  )
}
