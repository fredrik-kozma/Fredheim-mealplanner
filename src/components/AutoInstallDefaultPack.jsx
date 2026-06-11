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

  useEffect(() => {
    for (const pack of Object.values(BUILT_IN_PACKS)) {
      const installed = installedPacks?.[pack.id]
      const needsAction = !installed || installed.version !== pack.version
      if (!needsAction) continue
      try {
        installPack(pack)
      } catch (err) {
        console.warn('AutoInstallDefaultPack: failed to sync', pack.id, err)
      }
    }
  }, [installedPacks, installPack])

  return null
}
