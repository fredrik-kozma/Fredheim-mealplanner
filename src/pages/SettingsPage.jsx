import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../store/useStore'
import { translateRecipe } from '../utils/translator'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import AuthModal from '../components/auth/AuthModal'

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

function SubscriptionSection() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { isActive, isTrial, isAdmin, status, daysLeft, periodEndsAt, refetch } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('signin')

  async function handleCheckout() {
    if (!user) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          returnUrl: window.location.origin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handlePortal() {
    if (!user) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, returnUrl: window.location.origin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const statusLabels = {
    admin:     { text: t('subscription.adminAccess'),   color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    active:    { text: t('subscription.activeStatus'),  color: 'text-green-700  bg-green-50  border-green-200'  },
    trialing:  { text: t('subscription.trialDaysLeft', { count: daysLeft }), color: 'text-amber-700 bg-amber-50 border-amber-200' },
    past_due:  { text: t('subscription.pastDueStatus'), color: 'text-red-700   bg-red-50    border-red-200'    },
    canceled:  { text: t('subscription.canceledStatus'),color: 'text-slate-700 bg-slate-50  border-slate-200'  },
    expired:   { text: t('subscription.expiredStatus'), color: 'text-slate-700 bg-slate-50  border-slate-200'  },
    none:      { text: t('subscription.noAccount'),     color: 'text-slate-500 bg-slate-50  border-slate-200'  },
  }
  const badge = statusLabels[status] || statusLabels.none

  return (
    <>
      <SectionCard title={t('subscription.title')}>
        {user ? (
          <div className="space-y-4">
            {/* Current status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{user.email}</span>
              <span className={`text-xs font-semibold border rounded-full px-2.5 py-1 ${badge.color}`}>
                {badge.text}
              </span>
            </div>

            {/* Renewal date */}
            {status === 'active' && periodEndsAt && (
              <p className="text-xs text-slate-500">
                {t('subscription.renewsOn', {
                  date: periodEndsAt.toLocaleDateString(undefined, { dateStyle: 'medium' }),
                })}
              </p>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Actions */}
            {/* Subscribe — for trial users (upgrade) and expired/no-sub users */}
            {!isAdmin && (isTrial || !isActive) && (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? '…' : (isTrial
                  ? t('subscription.upgradeNow', { defaultValue: t('subscription.subscribeNow') })
                  : t('subscription.subscribeNow'))}
              </button>
            )}
            {/* Manage — paid active subscribers */}
            {!isAdmin && isActive && !isTrial && (
              <button
                onClick={handlePortal}
                disabled={loading}
                className="btn-secondary w-full py-2 text-sm"
              >
                {loading ? '…' : t('subscription.manage')}
              </button>
            )}
            {/* Trial users — also let them cancel via portal */}
            {!isAdmin && isTrial && (
              <button
                onClick={handlePortal}
                disabled={loading}
                className="btn-ghost w-full py-2 text-xs text-slate-500"
              >
                {loading ? '…' : t('subscription.manage')}
              </button>
            )}
            {status === 'past_due' && (
              <button
                onClick={handlePortal}
                disabled={loading}
                className="btn-danger w-full py-2 text-sm"
              >
                {loading ? '…' : t('subscription.updatePayment')}
              </button>
            )}

            {/* Sign out */}
            <button
              onClick={() => { signOut().catch(() => {}) }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              {t('auth.signOut')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">{t('subscription.notSignedIn')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setAuthTab('signup'); setShowAuth(true) }}
                className="btn-primary flex-1 py-2 text-sm"
              >
                {t('auth.startTrial')}
              </button>
              <button
                onClick={() => { setAuthTab('signin'); setShowAuth(true) }}
                className="btn-secondary flex-1 py-2 text-sm"
              >
                {t('auth.signIn')}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {showAuth && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  )
}

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
        {/* Subscription */}
        <SubscriptionSection />

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

        {/* Tutorial */}
        <SectionCard title={t('settings.tutorial', { defaultValue: 'App tutorial' })}>
          <p className="text-sm text-slate-500 mb-3">
            {t('settings.tutorialDesc', { defaultValue: 'Take a quick tour to see how to plan meals, build shopping lists, and get the most out of the app.' })}
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-tutorial'))}
            className="btn-secondary w-full py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            {t('settings.showTutorial', { defaultValue: 'Show tutorial' })}
          </button>
        </SectionCard>

        {/* Help & Support */}
        <SectionCard title={t('settings.support', { defaultValue: 'Help & Support' })}>
          <p className="text-sm text-slate-500 mb-3">
            {t('settings.supportDesc', { defaultValue: 'Have a question or running into an issue? We\'re happy to help.' })}
          </p>
          <a
            href="mailto:viverahealth@gmail.com"
            className="btn-secondary w-full py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            {t('settings.contactSupport', { defaultValue: 'Contact support' })}
          </a>
        </SectionCard>

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
