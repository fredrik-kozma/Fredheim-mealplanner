import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from './useSubscription'
import useStore from '../store/useStore'

/**
 * Central gating hook for the soft paywall.
 *
 * - canAccess         → true if user has admin / trial / active subscription
 * - isAnonymous       → true if not signed in at all
 * - isLocked          → !canAccess (convenience)
 * - previewRecipeIds  → 2 recipes that anonymous visitors CAN open fully
 *                       (first Breakfast + first Dinner, picked dynamically
 *                        so it works no matter which packs are installed)
 * - isPreviewRecipe() → check if a given recipe id is in the preview set
 */
export function useAccess() {
  const { user } = useAuth()
  const { isActive } = useSubscription()
  const recipes = useStore((s) => s.recipes)

  const previewRecipeIds = useMemo(() => {
    if (!recipes?.length) return []
    const ids = []
    // First breakfast recipe with an image
    const breakfast = recipes.find(
      (r) => r.category === 'Breakfast' && r.imageUrl
    )
    if (breakfast) ids.push(breakfast.id)
    // First dinner/main recipe with an image
    const dinner = recipes.find(
      (r) => (r.category === 'Dinner' || r.category === 'Main') && r.imageUrl
    )
    if (dinner) ids.push(dinner.id)
    // Fallback: if categories don't exist, pick the first two recipes
    if (ids.length === 0 && recipes.length >= 2) {
      ids.push(recipes[0].id, recipes[1].id)
    } else if (ids.length === 1 && recipes.length >= 2) {
      const next = recipes.find((r) => !ids.includes(r.id))
      if (next) ids.push(next.id)
    }
    return ids
  }, [recipes])

  return {
    canAccess: isActive,
    isLocked: !isActive,
    isAnonymous: !user,
    isSignedIn: !!user,
    previewRecipeIds,
    isPreviewRecipe: (id) => previewRecipeIds.includes(id),
  }
}
