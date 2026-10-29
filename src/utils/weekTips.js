/**
 * The Smart tips text of a generated week ("Make my week"), rendered from
 * data rather than stored as finished prose, so it can be rendered again in
 * another language.
 *
 * makeMyWeek returns notices ({ key, ...params }), stats and fruit counts.
 * The week's notes keep that data next to the text it produced:
 *   weekNotes = { week, days, tips: { data, rendered: { week, days } } }
 * On a language switch, LocalizedWeekTips renders the data again and
 * replaces the text — only where it still reads exactly as rendered, so a
 * tip the user has edited stays theirs.
 *
 * Pure: the caller passes `t` and the lookups, so this works the same in
 * the modal preview, on install and in the language-switch re-render.
 */
import { GOAL_TAG, answerGoals } from './makeMyWeek.js'

/**
 * @param {object} helpers
 * @param {Function} helpers.t         i18next t, in the language to render
 * @param {Function} helpers.titleOf   recipe id -> title in that language
 * @param {Function} [helpers.packName] pack id -> pack name
 */
export function noticeText(n, { t, titleOf, packName = id => id }, stats = null) {
  switch (n.key) {
    case 'packMissing':
      return t('makeMyWeek.notice.packMissing', { pack: packName(n.packId) })
    case 'batchTip': {
      const list = [
        n.soup && t('makeMyWeek.batchSoup', { name: titleOf(n.soup) }),
        n.bread && t('makeMyWeek.batchBread', { name: titleOf(n.bread) }),
        n.spread && t('makeMyWeek.batchSpread', { name: titleOf(n.spread) }),
      ].filter(Boolean).join(', ')
      return t('makeMyWeek.notice.batchTip', { list })
    }
    case 'extraBread':
      return t('makeMyWeek.notice.extraBread', { name: titleOf(n.bread) })
    case 'fmdAllergens':
      return t('makeMyWeek.notice.fmdAllergens', { list: n.allergens.map(a => t(`allergens.${a}`)).join(', ') })
    case 'goalRelaxed':
      return t('makeMyWeek.notice.goalRelaxed', {
        goals: (n.goals || []).map(g => t(`makeMyWeek.goals.${g}`)).join(', '),
        kept: (n.kept || []).map(g => t(`makeMyWeek.goals.${g}`)).join(', '),
      })
    case 'breakfastRelaxed':
      return t('makeMyWeek.notice.breakfastRelaxed', { kind: t(`makeMyWeek.breakfastKinds.${n.breakfast}`) })
    case 'favouritesUsed':
      return t('makeMyWeek.notice.favouritesUsed', { count: n.count })
    case 'saltLevel':
      return t(n.level === 'standard' ? 'makeMyWeek.notice.saltStandard' : n.auto ? 'makeMyWeek.notice.saltLowAuto' : 'makeMyWeek.notice.saltLow')
    case 'kcalLow':
      return t(stats?.meals === 1 ? 'makeMyWeek.notice.kcalLowDinner' : 'makeMyWeek.notice.kcalLow', { target: n.target })
    case 'portionsFitted':
      return t(stats?.meals === 1 ? 'makeMyWeek.notice.portionsFittedDinner' : 'makeMyWeek.notice.portionsFitted', { target: n.target })
    case 'kcalOffTarget':
      return t('makeMyWeek.notice.kcalOffTarget', { count: n.count })
    default:
      return t(`makeMyWeek.notice.${n.key}`)
  }
}

export function statsText(stats, { t }) {
  if (!stats) return null
  // With the user's own calorie target, the line names it.
  if (stats.fitted && stats.kcalTarget) {
    return t(stats.meals === 1 ? 'makeMyWeek.statsDinnerTarget' : 'makeMyWeek.statsDayTarget', { kcal: stats.kcal, fibre: stats.fibre, target: stats.kcalTarget })
  }
  return t(stats.meals === 1 ? 'makeMyWeek.statsDinner' : 'makeMyWeek.statsDay', { kcal: stats.kcal, fibre: stats.fibre })
}

/**
 * The data a generated week's tips are rendered from. `notices` without
 * packMissing: that one goes stale as soon as the pack is added.
 */
export function weekTipsData({ goal, goals, notices = [], stats = null, fruit = {} }) {
  return {
    // `goals` (several) since Make my week became multiple choice; tips
    // saved before that carry a single `goal`, which still renders.
    goals: answerGoals({ goals, goal }),
    notices: notices.filter(n => n.key !== 'packMissing'),
    stats: stats
      ? { kcal: stats.kcal, fibre: stats.fibre, meals: stats.meals, ...(stats.fitted ? { fitted: true, kcalTarget: stats.kcalTarget } : {}) }
      : null,
    fruit: { ...fruit },
  }
}

/** { week, days } text for weekTipsData() output, in the language of `t`. */
export function renderWeekTips(data, helpers) {
  const { t } = helpers
  const lines = [t('makeMyWeek.doctorNote')]
  const tags = answerGoals(data).map(g => GOAL_TAG[g]).filter(Boolean)
  if (tags.length === 1) lines.push(t('makeMyWeek.goalNote', { label: t(`conditions.${tags[0]}`) }))
  else if (tags.length) lines.push(t('makeMyWeek.goalNoteMany', { labels: tags.map(tag => `“${t(`conditions.${tag}`)}”`).join(', ') }))
  for (const n of data.notices || []) lines.push(noticeText(n, helpers, data.stats))
  const s = statsText(data.stats, helpers)
  if (s) lines.push(s)
  const days = {}
  for (const [day, count] of Object.entries(data.fruit || {})) {
    if (count > 0) days[day] = t('makeMyWeek.dayFruit', { count })
  }
  return { week: lines.join('\n\n'), days }
}
