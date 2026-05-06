// Base URL for the remote recipe pack registry.
// To point at your own GitHub repo, change YOUR_USERNAME below.
export const REGISTRY_URL =
  'https://raw.githubusercontent.com/YOUR_USERNAME/menu-planner-recipes/main'

/**
 * Fetches the registry index from the remote GitHub repo.
 * Returns an array of pack metadata objects.
 */
export async function fetchRegistry() {
  const res = await fetch(`${REGISTRY_URL}/registry.json`)
  if (!res.ok) throw new Error(`Registry fetch failed: ${res.status}`)
  return res.json()
}

/**
 * Fetches a single pack file (with full recipe data) from the remote repo.
 * @param {string} packId  e.g. "healthy-basics"
 */
export async function fetchPack(packId) {
  const res = await fetch(`${REGISTRY_URL}/packs/${packId}.json`)
  if (!res.ok) throw new Error(`Pack fetch failed (${packId}): ${res.status}`)
  return res.json()
}
