import { useEffect } from 'react'
import useStore from '../store/useStore'
import { BUILT_IN_PACKS } from '../data/installedPacks'

/**
 * Keeps the user's installed copies of every built-in recipe pack in
 * sync with the latest shipped version, automatically.
 *
 * Two related jobs in one component:
 *
 *  1. First-visit install. Brand-new visitors get every built-in pack
 *     installed automatically so the app has content immediately
 *     instead of an empty screen.
 *
 *  2. Silent auto-update. On every app load we compare the version
 *     stamped on the user's installed pack record to the version of
 *     the pack that's currently shipped in the JS bundle. If they
 *     differ, we re-install the pack — which (thanks to the
 *     install-or-update logic in the store) refreshes the recipe
 *     content without touching user-created recipes. The result: bug
 *     fixes and content updates (e.g. adding tahini to the hummus
 *     recipe) reach the user without them ever having to tap "Update".
 *
 * Runs behind the HydrationGate so it doesn't race the IndexedDB
 * restore. The effect's dependency list narrows the trigger so it
 * runs once per content-change tick, never in a loop.
 */
export default function AutoInstallDefaultPack() {
  const installedPacks = useStore((s) => s.installedPacks)
  const installPack = useStore((s) => s.installPack)

  // Which built-in packs currently have no recipes in the store. Pack
  // recipes aren't persisted (see partialize in useStore) — they're
  // rebuilt here on every load — so after a reload the version record
  // says "installed" while the recipes themselves are absent. Without
  // this check the version comparison alone would short-circuit and
  // leave the user with an empty app.
  //
  // Derived to a stable joined string rather than an array/Set so the
  // effect re-runs only when the set of empty packs actually changes,
  // not on every unrelated recipe edit.
  const emptyPackIds = useStore((s) => {
    const present = new Set()
    for (const r of s.recipes) if (r.sourcePackId) present.add(r.sourcePackId)
    return Object.values(BUILT_IN_PACKS)
      .filter((p) => !present.has(p.id))
      .map((p) => p.id)
      .join(',')
  })

  useEffect(() => {
    const empty = new Set(emptyPackIds ? emptyPackIds.split(',') : [])
    for (const pack of Object.values(BUILT_IN_PACKS)) {
      const installed = installedPacks?.[pack.id]
      const needsAction =
        !installed || installed.version !== pack.version || empty.has(pack.id)
      if (!needsAction) continue
      try {
        installPack(pack)
      } catch (err) {
        console.warn('AutoInstallDefaultPack: failed to sync', pack.id, err)
      }
    }
  }, [installedPacks, emptyPackIds, installPack])

  return null
}
