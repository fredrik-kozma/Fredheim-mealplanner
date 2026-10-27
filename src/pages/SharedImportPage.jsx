import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../store/useStore'
import { decodeShare } from '../utils/shareCodec'
import { validateSharePayload, countPayloadMeals, countShoppingItems, shoppingPayloadToGroups, SHARE_WEEK, SHARE_RECIPE, SHARE_SHOPPING } from '../utils/sharePayload'
import { formatQuantity } from '../utils/formatQuantity'
import { nameForAmount } from '../utils/ingredientDictionary'

/**
 * What a shared link opens.
 *
 * Nothing is imported on arrival. The link came from a chat app and the
 * person following it has not yet seen what is in it — and a week plan
 * replaces the whole planner, which is not something to do to someone
 * who merely tapped a link. So this shows what the link holds and waits
 * to be told.
 */
export default function SharedImportPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.slice(0, 2) || 'en'

  const recipes = useStore(s => s.recipes)
  const installStarterPlan = useStore(s => s.installStarterPlan)
  const addRecipe = useStore(s => s.addRecipe)
  const saveShoppingList = useStore(s => s.saveShoppingList)
  const addCustomShoppingItem = useStore(s => s.addCustomShoppingItem)
  const weekPlan = useStore(s => s.weekPlan)

  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let alive = true
    decodeShare(code).then(payload => {
      if (!alive) return
      const check = validateSharePayload(payload)
      setState(check.ok ? { status: 'ready', payload, check } : { status: 'bad', reason: check.reason })
    })
    return () => { alive = false }
  }, [code])

  // How much the recipient stands to lose, so the warning can be honest
  // about it rather than generic.
  const currentMeals = useMemo(() => countPayloadMeals(weekPlan), [weekPlan])

  if (state.status === 'loading') {
    return <Shell><p className="text-sm text-slate-500">{t('share.opening', { defaultValue: 'Opening…' })}</p></Shell>
  }

  if (state.status === 'bad') {
    return (
      <Shell>
        <h1 className="text-lg font-semibold text-slate-800 mb-2">
          {t('share.badTitle', { defaultValue: "This link didn't work" })}
        </h1>
        <p className="text-sm text-slate-600 mb-5">
          {state.reason === 'version'
            ? t('share.badVersion', { defaultValue: 'It was made by a newer version of the app. Update and try again.' })
            : t('share.badLink', { defaultValue: 'It may have been cut short when it was sent. Ask for it again, as a complete link.' })}
        </p>
        <button onClick={() => navigate('/')} className="btn-primary px-4 py-2">
          {t('share.goHome', { defaultValue: 'Go to recipes' })}
        </button>
      </Shell>
    )
  }

  const { payload, check } = state

  if (check.kind === SHARE_WEEK) {
    const meals = countPayloadMeals(payload.plan)
    return (
      <Shell>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 mb-1">
          {t('share.sharedWithYou', { defaultValue: 'Shared with you' })}
        </p>
        <h1 className="text-lg font-semibold text-slate-800 mb-1">
          {payload.name || t('share.aWeekMenu', { defaultValue: 'A week of meals' })}
        </h1>
        <p className="text-sm text-slate-600 mb-5">
          {t('share.weekSummary', { count: meals, defaultValue: '{{count}} meals planned' })}
        </p>

        {currentMeals > 0 && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            {t('share.replaceWarning', {
              count: currentMeals,
              defaultValue: 'This replaces the week you have now ({{count}} meals). Save it first if you want to keep it.',
            })}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              installStarterPlan({
                name: payload.name,
                plan: payload.plan,
                notes: payload.notes,
                batchCook: payload.batchCook,
                portions: payload.portions,
              }, lang)
              navigate('/planner')
            }}
            className="btn-primary px-4 py-2"
          >
            {t('share.addWeek', { defaultValue: 'Add to my planner' })}
          </button>
          <button onClick={() => navigate('/planner')} className="btn-secondary px-4 py-2">
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
        </div>
      </Shell>
    )
  }

  if (check.kind === SHARE_SHOPPING) {
    const count = countShoppingItems(payload)
    const groups = shoppingPayloadToGroups(payload)
    return (
      <Shell>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 mb-1">
          {t('share.sharedWithYou', { defaultValue: 'Shared with you' })}
        </p>
        <h1 className="text-lg font-semibold text-slate-800 mb-1">
          {payload.name || t('share.aShoppingList', { defaultValue: 'A shopping list' })}
        </h1>
        <p className="text-sm text-slate-600 mb-1">
          {t('share.shoppingSummary', { count, defaultValue: '{{count}} items' })}
          {payload.portions ? ` · ${t('shopping.forPeople', { count: payload.portions, defaultValue: 'for {{count}} people' })}` : ''}
        </p>
        <p className="text-xs text-slate-400 mb-4">
          {t('share.shoppingSnapshot', {
            defaultValue: "This is a copy as it was when it was sent. It won't update if they change their week.",
          })}
        </p>

        {/* A peek at the contents. Saving something unseen is how you end
            up with lists nobody can identify a week later. */}
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-4 max-h-40 overflow-y-auto">
          {groups.map(g => (
            <div key={g.category} className="mb-1.5 last:mb-0">
              <span className="font-semibold text-slate-700">
                {g.category === '__custom__'
                  ? t('shopping.myItems', { defaultValue: 'My items' })
                  : t(`aisles.${g.category}`, { defaultValue: g.category })}
              </span>
              <span className="text-slate-500"> · {g.items.map(i => i.name).join(', ')}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              // Its own list, beside their own. Never replaces the live
              // one — which is generated from their week plan anyway and
              // would simply regenerate.
              saveShoppingList(payload.name || t('share.aShoppingList', { defaultValue: 'A shopping list' }), groups, payload.portions)
              navigate('/shopping')
            }}
            className="btn-primary px-4 py-2"
          >
            {t('share.saveShoppingList', { defaultValue: 'Save as its own list' })}
          </button>
          <button
            onClick={() => {
              // "Can you pick these up too" — the items join their live
              // list under My items, with the amount kept as written.
              for (const g of groups) {
                for (const it of g.items) {
                  const amount = it.custom
                    ? (it.quantity || '')
                    : formatQuantity(it.quantity, it.unit, lang, { roundUpWhole: true })
                  addCustomShoppingItem(it.custom ? it.name : nameForAmount(it, lang, it.quantity, it.unit, { roundUpWhole: true }), amount)
                }
              }
              navigate('/shopping')
            }}
            className="btn-secondary px-4 py-2"
          >
            {t('share.mergeShoppingList', { defaultValue: 'Add to my list' })}
          </button>
        </div>
        <button onClick={() => navigate('/shopping')} className="btn-ghost text-xs text-slate-400 mt-3">
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </button>
      </Shell>
    )
  }

  // ---- a recipe ----
  if (check.byId) {
    const found = recipes.find(r => r.id === payload.id)
    if (found) {
      return (
        <Shell>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 mb-1">
            {t('share.sharedWithYou', { defaultValue: 'Shared with you' })}
          </p>
          <h1 className="text-lg font-semibold text-slate-800 mb-5">
            {found.translations?.[lang]?.title || found.title}
          </h1>
          <button onClick={() => navigate(`/recipes/${found.id}`, { replace: true })} className="btn-primary px-4 py-2">
            {t('share.openRecipe', { defaultValue: 'Open the recipe' })}
          </button>
        </Shell>
      )
    }
    // The sender had a pack this person doesn't. Naming it is the only
    // useful thing we can say — the link cannot carry the recipe itself
    // because it was only ever a pointer into that pack.
    return (
      <Shell>
        <h1 className="text-lg font-semibold text-slate-800 mb-2">
          {payload.title || t('share.aRecipe', { defaultValue: 'A recipe' })}
        </h1>
        <p className="text-sm text-slate-600 mb-5">
          {t('share.needPack', {
            defaultValue: "You don't have this recipe yet. It comes from a recipe pack — install it under Packs and open the link again.",
          })}
        </p>
        <button onClick={() => navigate('/packs')} className="btn-primary px-4 py-2">
          {t('share.goPacks', { defaultValue: 'Go to packs' })}
        </button>
      </Shell>
    )
  }

  const incoming = payload.recipe
  return (
    <Shell>
      <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 mb-1">
        {t('share.sharedWithYou', { defaultValue: 'Shared with you' })}
      </p>
      <h1 className="text-lg font-semibold text-slate-800 mb-1">
        {incoming.translations?.[lang]?.title || incoming.title}
      </h1>
      <p className="text-sm text-slate-600 mb-1">
        {t('share.recipeSummary', {
          count: incoming.ingredients?.length || 0,
          defaultValue: '{{count}} ingredients',
        })}
      </p>
      {payload.hadPhoto && (
        <p className="text-xs text-slate-400 mb-5">
          {t('share.noPhoto', { defaultValue: 'The photo was too big to send in a link — the recipe itself is complete.' })}
        </p>
      )}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => {
            addRecipe(incoming)
            navigate('/')
          }}
          className="btn-primary px-4 py-2"
        >
          {t('share.saveRecipe', { defaultValue: 'Save to my recipes' })}
        </button>
        <button onClick={() => navigate('/')} className="btn-secondary px-4 py-2">
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </button>
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="px-5 py-8 max-w-lg mx-auto">
      <div className="card p-5">{children}</div>
    </div>
  )
}
