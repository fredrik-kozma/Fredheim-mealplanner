import { useEffect, useState } from 'react'
import { loadTicks, saveTicks, toggleTick, resetTicks } from '../utils/cookingTicks'

/**
 * A recipe's cooking ticks. Reads them again when the page comes back into
 * view, because a phone can keep this tab open overnight and the ticks should
 * still be gone in the morning.
 */
export function useCookingTicks(recipeId) {
  const [state, setState] = useState(() => ({ recipeId, ticks: loadTicks(recipeId) }))

  // Following a "See also" link keeps this component but changes the recipe.
  let current = state
  if (state.recipeId !== recipeId) {
    current = { recipeId, ticks: loadTicks(recipeId) }
    setState(current)
  }

  useEffect(() => {
    function reload() {
      if (document.visibilityState === 'visible') {
        setState({ recipeId, ticks: loadTicks(recipeId) })
      }
    }
    document.addEventListener('visibilitychange', reload)
    return () => document.removeEventListener('visibilitychange', reload)
  }, [recipeId])

  function update(ticks) {
    saveTicks(recipeId, ticks)
    setState({ recipeId, ticks })
  }

  return {
    ticks: current.ticks,
    toggle: (kind, index) => update(toggleTick(current.ticks, kind, index)),
    reset: kind => update(resetTicks(current.ticks, kind)),
  }
}
