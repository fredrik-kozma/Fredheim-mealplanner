// Device copies of plans and preferences. The account itself lives in
// Supabase; these keys are what a deletion on this device can actually reach.
// Built-in recipes are not in this list — they ship with the app.

import { idbStorage } from '../store/idbStorage.js'
import { FODMAP_IDB_KEY } from './fodmap/storage.js'

export const LOCAL_STORAGE_KEYS = [
  'menu-planner-store',
  'menuPlannerLang',
  'fredheim:missing-ingredient-requests',
  'fredheim-mmw-remembered',
  'fredheim_week_tips_open',
]

export const SESSION_STORAGE_KEYS = [
  'fredheim_sub_cache_v1',
  'fredheim_preview_banner_dismissed',
]

export const IDB_STORE_KEY = 'menu-planner-store'
export { FODMAP_IDB_KEY }

export async function clearLocalAccountData(deps = {}) {
  const ls = deps.localStorage !== undefined ? deps.localStorage : globalThis.localStorage
  const ss = deps.sessionStorage !== undefined ? deps.sessionStorage : globalThis.sessionStorage

  if (ls) {
    for (const key of LOCAL_STORAGE_KEYS) {
      try { ls.removeItem(key) } catch { /* private mode */ }
    }
  }
  if (ss) {
    for (const key of SESSION_STORAGE_KEYS) {
      try { ss.removeItem(key) } catch { /* ignore */ }
    }
  }

  const storage = deps.storage || idbStorage
  await storage.removeItem(IDB_STORE_KEY)
  await storage.removeItem(FODMAP_IDB_KEY)
}
