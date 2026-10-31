/**
 * UnitSelect that can limit options to engine-convertible units.
 * Drop-in beside the existing UnitSelect: pass `allowedUnits={['g','tsp',…]}`.
 * When allowedUnits is null/undefined, behaves like the full UnitSelect.
 *
 * On the PC, prefer patching UnitSelect.jsx to accept `allowedUnits` instead
 * of maintaining two components — see patches/UnitSelect.allowedUnits.diff.md
 */
import { useTranslation } from 'react-i18next'
import { displayUnit, normalizeUnit } from '../../utils/unitNormalizer.js'

const FALLBACK_ORDER = ['g', 'kg', 'ml', 'dl', 'l', 'cup', 'tsp', 'tbsp', 'pcs', 'clove']

export default function UnitSelectRestricted({
  value,
  onChange,
  allowedUnits = null,
  className = '',
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'en'
  const normalized = value ? normalizeUnit(value) : ''
  const keys = allowedUnits?.length
    ? FALLBACK_ORDER.filter((u) => allowedUnits.includes(u))
    : FALLBACK_ORDER

  // If current value isn't allowed, still show it so the select isn't blank
  const options = keys.slice()
  if (normalized && !options.includes(normalized)) options.unshift(normalized)

  return (
    <select
      className={`input w-24 flex-shrink-0 ${className}`}
      value={normalized || value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t('recipeForm.ingredientUnit')}
    >
      <option value="">{t('units.none', { defaultValue: '—' })}</option>
      {options.map((key) => (
        <option key={key} value={key}>
          {displayUnit ? displayUnit(key, lang) : key}
        </option>
      ))}
    </select>
  )
}
