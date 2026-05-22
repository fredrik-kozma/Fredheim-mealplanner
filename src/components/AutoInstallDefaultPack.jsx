import { useEffect } from 'react'
import useStore from '../store/useStore'
import { BUILT_IN_PACKS } from '../data/installedPacks'

/**
 * On a fresh first visit (no recipes installed at all) we automatically
 * install the built-in Fredheim pack so the app has immediate content to
 * showcase. Without this, anonymous visitors land on an empty screen and
 * have nothing to preview.
 *
 * Runs exactly once per browser, behind the HydrationGate so it doesn't
 * race with IndexedDB restore.
 */
export default function AutoInstallDefaultPack() {
  const recipes = useStore((s) => s.recipes)
  const installedPacks = useStore((s) => s.installedPacks)
  const installPack = useStore((s) => s.installPack)

  useEffect(() => {
    // Already has content — don't touch anything.
    if (recipes?.length > 0) return
    if (Object.keys(installedPacks || {}).length > 0) return

    // Install every built-in pack (currently just Fredheim).
    Object.values(BUILT_IN_PACKS).forEach((pack) => {
      try {
        installPack(pack)
      } catch (err) {
        console.warn('AutoInstallDefaultPack: failed to install', pack.id, err)
      }
    })
  }, [recipes, installedPacks, installPack])

  return null
}
