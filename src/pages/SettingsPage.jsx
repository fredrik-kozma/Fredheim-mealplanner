import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../store/useStore'
import { translateRecipe } from '../utils/translator'

function SectionCard({ title, children }) {
  return (
    <div className="card p-5 mb-4">
      <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function TagList({ items, onRemove, emptyText, labelFor }) {
  return (
    <div className="flex flex-wrap gap-2 min-h-[36px]">
      {items.length === 0 && <p className="text-sm text-slate-400">{emptyText}</p>}
      {items.map(item => (
        <span key={item} className="flex items-center gap-1.5 badge bg-indigo-50 text-indigo-700 pl-3 pr-2 py-1">
          {labelFor ? labelFor(item) : item}
          {onRemove && (
            <button
              onClick={() => onRemove(item)}
              className="text-indigo-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
]

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const language = useStore(s => s.language)
  const setLanguage = useStore(s => s.setLanguage)

  const familySize = useStore(s => s.familySize)
  const setFamilySize = useStore(s => s.setFamilySize)
  const units = useStore(s => s.units)
  const setUnits = useStore(s => s.setUnits)

  const recipeCategories = useStore(s => s.recipeCategories)
  const addRecipeCategory = useStore(s => s.addRecipeCategory)
  const removeRecipeCategory = useStore(s => s.removeRecipeCategory)

  const mealSlots = useStore(s => s.mealSlots)
  const addMealSlot = useStore(s => s.addMealSlot)
  const removeMealSlot = useStore(s => s.removeMealSlot)
  const renameMealSlot = useStore(s => s.renameMealSlot)

  const recipes = useStore(s => s.recipes)
  const updateRecipeTranslation = useStore(s => s.updateRecipeTranslation)
  const deleteAllRecipes = useStore(s => s.deleteAllRecipes)

  const customUnits = useStore(s => s.customUnits)
  const addCustomUnit = useStore(s => s.addCustomUnit)
  const removeCustomUnit = useStore(s => s.removeCustomUnit)

  const [newRecipeCat, setNewRecipeCat] = useState('')
  const [newMealSlot, setNewMealSlot] = useState('')
  const [newCustomUnit, setNewCustomUnit] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [bulkTranslating, setBulkTranslating] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })
  const [bulkStatus, setBulkStatus] = useState(null)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)

  function handleChangeLanguage(lang) {
    setLanguage(lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('menuPlannerLang', lang)
  }

  function handleAddRecipeCat() {
    const name = newRecipeCat.trim()
    if (!name) return
    addRecipeCategory(name)
    setNewRecipeCat('')
  }

  function handleAddMealSlot() {
    const name = newMealSlot.trim()
    if (!name) return
    addMealSlot(name)
    setNewMealSlot('')
  }

  async function handleTranslateAllMissing(targetLang) {
    // Find every recipe that doesn't yet have a translation for targetLang.
    // Source is the canonical (English) fields on the recipe itself.
    const missing = recipes.filter(r => !r.translations?.[targetLang])
    if (missing.length === 0) {
      setBulkStatus(t('settings.translateAllNoneMissing', { defaultValue: 'All recipes are already translated.' }))
      setTimeout(() => setBulkStatus(null), 3000)
      return
    }
    setBulkTranslating(true)
    setBulkProgress({ done: 0, total: missing.length })
    setBulkStatus(null)
    let failed = 0
    for (let i = 0; i < missing.length; i++) {
      const r = missing[i]
      try {
        const translated = await translateRecipe(r, r.translations?.sourceLang || 'en', targetLang)
        updateRecipeTranslation(r.id, targetLang, translated)
      } catch (err) {
        console.error('Bulk translate failed for', r.title, err)
        failed++
      }
      setBulkProgress({ done: i + 1, total: missing.length })
    }
    setBulkTranslating(false)
    setBulkStatus(
      failed > 0
        ? t('settings.translateAllPartial', { defaultValue: 'Translated {{ok}} of {{total}}. {{failed}} failed (rate limit?).', ok: missing.length - failed, total: missing.length, failed })
        : t('settings.translateAllDone', { defaultValue: 'Translated {{count}} recipes.', count: missing.length })
    )
    setTimeout(() => setBulkStatus(null), 6000)
  }

  function handleRename(slot) {
    const name = renameValue.trim()
    if (!name || name === slot) { setRenaming(null); return }
    renameMealSlot(slot, name)
    setRenaming(null)
  }

  const currentLang = i18n.language?.slice(0, 2) || language

  return (
    <div className="max-w-lg mx-auto pb-24 lg:pb-8">
      <div className="px-4 pt-4 lg:pt-6 pb-4">
        <h1 className="text-xl font-bold text-slate-900">{t('settings.title')}</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Language selector */}
        <SectionCard title={t('settings.language')}>
          <div className="grid grid-cols-3 gap-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleChangeLanguage(lang.code)}
                className={`py-3 rounded-xl border-2 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                  currentLang === lang.code
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-xs">{lang.label}</span>
              </button>
            ))}
          </div>

          {/* Bulk translate — fills in missing translations for any
              recipes (user-added or imported) that lack them. */}
          {(() => {
            const missingCount = recipes.filter(r => !r.translations?.[currentLang]).length
            if (currentLang === 'en') return null
            return (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">
                  {missingCount > 0
                    ? t('settings.translateAllHint', { defaultValue: '{{count}} recipes have no translation yet for this language.', count: missingCount })
                    : t('settings.translateAllAllGood', { defaultValue: 'All recipes are available in this language.' })}
                </p>
                <button
                  onClick={() => handleTranslateAllMissing(currentLang)}
                  disabled={bulkTranslating || missingCount === 0}
                  className="btn-secondary w-full py-2 text-xs"
                >
                  {bulkTranslating
                    ? `${t('settings.translating', { defaultValue: 'Translating' })} ${bulkProgress.done}/${bulkProgress.total}…`
                    : t('settings.translateAllMissing', { defaultValue: 'Translate all missing recipes' })}
                </button>
                {bulkStatus && (
                  <p className="text-xs text-green-700 mt-2 text-center">{bulkStatus}</p>
                )}
              </div>
            )
          })()}
        </SectionCard>

        {/* Family size */}
        <SectionCard title={t('settings.familySize')}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFamilySize(Math.max(1, familySize - 1))}
              className="btn-secondary w-10 h-10 p-0 text-xl"
            >−</button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-bold text-indigo-600">{familySize}</span>
              <p className="text-xs text-slate-500 mt-0.5">{t('settings.people')}</p>
            </div>
            <button
              onClick={() => setFamilySize(familySize + 1)}
              className="btn-secondary w-10 h-10 p-0 text-xl"
            >+</button>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            {t('settings.familySizeDesc')}
          </p>
        </SectionCard>

        {/* Units */}
        <SectionCard title={t('settings.measurementUnits')}>
          {/* 'imperial' is the legacy value; treat it as 'us' for selection. */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setUnits('metric')}
              className={`py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                units === 'metric'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              🇪🇺 {t('settings.metric')}
              <p className="text-xs font-normal opacity-70 mt-0.5">{t('settings.metricDesc')}</p>
            </button>
            <button
              onClick={() => setUnits('us')}
              className={`py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                units === 'us' || units === 'imperial'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              🇺🇸 {t('settings.imperial')}
              <p className="text-xs font-normal opacity-70 mt-0.5">{t('settings.imperialDesc')}</p>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {t('settings.unitsDesc', { defaultValue: 'Controls which units appear first in the recipe form. Any recipe can be viewed in the other system with one tap.' })}
          </p>
        </SectionCard>

        {/* Custom Units — user-defined unit labels that appear in the
            recipe form's unit dropdown alongside the built-in ones. */}
        <SectionCard title={t('settings.customUnits', { defaultValue: 'Custom units' })}>
          <p className="text-xs text-slate-500 mb-3">
            {t('settings.customUnitsDesc', { defaultValue: 'Add your own units (e.g. jar, sprig, bunch). They appear in the dropdown when adding ingredients.' })}
          </p>
          <TagList
            items={customUnits}
            onRemove={(u) => removeCustomUnit(u)}
            emptyText={t('settings.noCustomUnits', { defaultValue: 'No custom units yet.' })}
          />
          <div className="flex gap-2 mt-3">
            <input
              className="input flex-1"
              placeholder={t('settings.customUnitPlaceholder', { defaultValue: 'e.g. jar, sprig, bunch' })}
              value={newCustomUnit}
              onChange={e => setNewCustomUnit(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const v = newCustomUnit.trim()
                  if (v) { addCustomUnit(v); setNewCustomUnit('') }
                }
              }}
            />
            <button
              onClick={() => {
                const v = newCustomUnit.trim()
                if (v) { addCustomUnit(v); setNewCustomUnit('') }
              }}
              className="btn-primary"
            >
              {t('settings.addCustomUnit', { defaultValue: 'Add' })}
            </button>
          </div>
        </SectionCard>

        {/* Meal slots */}
        <SectionCard title={t('settings.mealSlots')}>
          <p className="text-xs text-slate-500 mb-3">{t('settings.mealSlotsDesc')}</p>
          <div className="space-y-2 mb-4">
            {mealSlots.map(slot => (
              <div key={slot} className="flex items-center gap-2">
                {renaming === slot ? (
                  <>
                    <input
                      autoFocus
                      className="input flex-1"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRename(slot)
                        if (e.key === 'Escape') setRenaming(null)
                      }}
                    />
                    <button onClick={() => handleRename(slot)} className="btn-primary py-2 px-3 text-xs">{t('settings.save')}</button>
                    <button onClick={() => setRenaming(null)} className="btn-secondary py-2 px-3 text-xs">{t('settings.cancel')}</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                      {t(`planner.mealSlots.${slot}`, { defaultValue: slot })}
                    </span>
                    <button
                      onClick={() => { setRenaming(slot); setRenameValue(slot) }}
                      className="btn-ghost py-2 px-2.5 text-slate-400"
                      title={t('common.edit')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                      </svg>
                    </button>
                    {mealSlots.length > 1 && (
                      <button
                        onClick={() => { if (confirm(t('settings.removeMealSlotConfirm', { name: slot }))) removeMealSlot(slot) }}
                        className="btn-ghost py-2 px-2.5 text-slate-300 hover:text-red-500"
                        title={t('settings.remove')}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder={t('settings.mealSlotPlaceholder')}
              value={newMealSlot}
              onChange={e => setNewMealSlot(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMealSlot()}
            />
            <button onClick={handleAddMealSlot} className="btn-primary">{t('settings.addMealSlot')}</button>
          </div>
        </SectionCard>

        {/* Recipe categories */}
        <SectionCard title={t('settings.recipeCategories')}>
          <p className="text-xs text-slate-500 mb-3">{t('settings.recipeCategoriesDesc')}</p>
          <TagList
            items={recipeCategories}
            onRemove={(cat) => { if (confirm(t('settings.removeCategoryConfirm', { name: cat }))) removeRecipeCategory(cat) }}
            emptyText={t('settings.noCategories')}
            labelFor={(cat) => t(`categories.${cat}`, { defaultValue: cat })}
          />
          <div className="flex gap-2 mt-3">
            <input
              className="input flex-1"
              placeholder={t('settings.newCategoryPlaceholder')}
              value={newRecipeCat}
              onChange={e => setNewRecipeCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddRecipeCat()}
            />
            <button onClick={handleAddRecipeCat} className="btn-primary">{t('settings.addCategory')}</button>
          </div>
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard title={t('settings.dangerZone', { defaultValue: 'Danger Zone' })}>
          <p className="text-xs text-slate-500 mb-3">{t('settings.deleteAllRecipesDesc', { defaultValue: 'Permanently delete all your recipes and clear the weekly planner. This cannot be undone.' })}</p>
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="btn-danger w-full py-2 text-sm"
            disabled={recipes.length === 0}
          >
            {t('settings.deleteAllRecipes', { defaultValue: 'Delete all recipes' })}
          </button>
        </SectionCard>

        {/* Delete All Recipes Modal */}
        {showDeleteAllModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteAllModal(false)} />
            <div className="relative z-10 bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl p-5">
              <div className="sm:hidden flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                {t('settings.deleteAllConfirmTitle', { defaultValue: 'Delete all recipes?' })}
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {t('settings.deleteAllConfirmDesc', { defaultValue: 'This will permanently delete all {{count}} recipes and clear your weekly planner. This action cannot be undone.', count: recipes.length })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="flex-1 btn-secondary py-2.5 text-sm font-medium"
                >
                  {t('settings.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  onClick={() => {
                    deleteAllRecipes()
                    setShowDeleteAllModal(false)
                  }}
                  className="flex-1 btn-danger py-2.5 text-sm font-medium"
                >
                  {t('settings.deleteConfirm', { defaultValue: 'Delete all' })}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* About */}
        <div className="card p-4 text-center">
          <div className="text-3xl mb-2">🍽</div>
          <p className="text-sm font-semibold text-slate-700">{t('app.name')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('app.version')}</p>
        </div>
      </div>
    </div>
  )
}
