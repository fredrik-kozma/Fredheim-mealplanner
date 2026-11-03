/**
 * Keep only entries whose keys are in `validIds`.
 *
 * If `validIds` is missing or empty, return the map unchanged. An empty
 * shopping list during pack install / first paint must NOT wipe checks —
 * pack recipes are rebuilt async from the bundle, so a premature prune
 * with no ids was clearing IndexedDB-persisted ticks on every refresh.
 */
export function pruneIdMap(map, validIds) {
  if (!validIds || validIds.size === 0) return map
  let changed = false
  const next = {}
  for (const id of Object.keys(map || {})) {
    if (validIds.has(id)) next[id] = map[id]
    else changed = true
  }
  return changed ? next : map
}
