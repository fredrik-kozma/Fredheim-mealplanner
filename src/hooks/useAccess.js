import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from './useSubscription'
import { FREE_RECIPE_IDS, isFreeRecipe } from '../data/freeRecipes'

/**
 * Central gating hook for the soft paywall.
 *
 * - canAccess        → true if user has admin / trial / active subscription
 * - isAnonymous      → true if not signed in at all
 * - isLocked         → !canAccess (convenience)
 * - previewRecipeIds → the free starter set (src/data/freeRecipes.js).
 *                      These recipes open in full for anyone without Premium,
 *                      on the website logged out and in the Android app.
 * - isPreviewRecipe()→ check if a given recipe id is in that set
 */
export function useAccess() {
  const { user } = useAuth()
  const { isActive } = useSubscription()

  return {
    canAccess: isActive,
    isLocked: !isActive,
    isAnonymous: !user,
    isSignedIn: !!user,
    previewRecipeIds: FREE_RECIPE_IDS,
    isPreviewRecipe: isFreeRecipe,
  }
}
