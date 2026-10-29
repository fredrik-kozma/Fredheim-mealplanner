import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { BUILT_IN_PACKS } from '../../data/installedPacks'
import { renderWeekTips } from '../../utils/weekTips'

/**
 * Keeps a generated week's Smart tips (and its fruit day notes) in the
 * current language. The tips are stored with the data they were rendered
 * from (src/utils/weekTips.js); when the language changes they are
 * rendered again, and the store swaps in the new text wherever the user
 * hasn't edited it. Mounted once, app-wide, so prints and exports read
 * the right language too.
 */
export default function LocalizedWeekTips() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.slice(0, 2) || 'en'
  const tips = useStore(s => s.weekNotes?.tips)
  const recipes = useStore(s => s.recipes)
  const relocalizeWeekTips = useStore(s => s.relocalizeWeekTips)

  const titleById = useMemo(() => {
    const m = new Map()
    for (const r of recipes) m.set(r.id, r.translations?.[lang]?.title || r.title)
    return m
  }, [recipes, lang])

  useEffect(() => {
    if (!tips?.data || !tips.rendered) return
    const packName = id => BUILT_IN_PACKS[id]?.translations?.[lang]?.name || BUILT_IN_PACKS[id]?.name || id
    const next = renderWeekTips(tips.data, { t, titleOf: id => titleById.get(id) || id, packName })
    const same = next.week === tips.rendered.week &&
      JSON.stringify(next.days) === JSON.stringify(tips.rendered.days || {})
    if (!same) relocalizeWeekTips(next)
  }, [tips, t, lang, titleById, relocalizeWeekTips])

  return null
}
