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

  // Which built-in packs are missing recipes in the store. Pack recipes
  // aren't persisted (see partialize in useStore) — they're rebuilt here
  // on every load — so after a reload the version record says "installed"
  // while the recipes themselves are absent. Without this check the
  // version comparison alone would short-circuit and leave an empty app.
  //
  // This counts rather than merely asking "any at all?", because a pack
  // recipe the user edited in-app IS persisted: one surviving recipe
  // would make an otherwise-empty pack look present and strand the other
  // few hundred.
  //
  // Derived to a stable joined string rather than an array/Set so the
  // effect re-runs only when the set actually changes, not on every
  // unrelated recipe edit.
  const incompletePackIds = useStore((s) => {
    const counts = new Map()
    for (const r of s.recipes) {
      if (r.sourcePackId) counts.set(r.sourcePackId, (counts.get(r.sourcePackId) || 0) + 1)
    }
    return Object.values(BUILT_IN_PACKS)
      .filter((p) => (counts.get(p.id) || 0) < p.recipes.length)
      .map((p) => p.id)
      .join(',')
  })

  useEffect(() => {
    const incomplete = new Set(incompletePackIds ? incompletePackIds.split(',') : [])
    for (const pack of Object.values(BUILT_IN_PACKS)) {
      const installed = installedPacks?.[pack.id]
      const versionChanged = !installed || installed.version !== pack.version
      if (!versionChanged && !incomplete.has(pack.id)) continue
      try {
        // Refilling after a reload must not clobber an in-app edit; a real
        // version change must, since the new pack content supersedes it.
        installPack(pack, { preserveUserEdits: !versionChanged })
      } catch (err) {
        console.warn('AutoInstallDefaultPack: failed to sync', pack.id, err)
      }
    }
  }, [installedPacks, incompletePackIds, installPack])

  return null
}
