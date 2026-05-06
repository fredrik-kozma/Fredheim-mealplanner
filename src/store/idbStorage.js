// IndexedDB-backed storage adapter for Zustand's `persist` middleware.
//
// Zustand's persist middleware talks to any object shaped
//   { getItem(name), setItem(name, value), removeItem(name) }
// where the values are strings. `idb-keyval` gives us exactly that, but
// backed by IndexedDB, which typically allows 50% of free disk space — far
// more than the ~5 MB hard cap on localStorage.
//
// This is the single change that lets users keep hundreds of recipes with
// photos without running out of room.

import { get, set, del, createStore } from 'idb-keyval'

const store = createStore('menu-planner-db', 'keyval')

export const idbStorage = {
  getItem: async (name) => {
    try {
      const val = await get(name, store)
      return val ?? null
    } catch (err) {
      console.warn('[idbStorage] getItem failed', err)
      return null
    }
  },
  setItem: async (name, value) => {
    try {
      await set(name, value, store)
    } catch (err) {
      console.error('[idbStorage] setItem failed', err)
      throw err
    }
  },
  removeItem: async (name) => {
    try {
      await del(name, store)
    } catch (err) {
      console.warn('[idbStorage] removeItem failed', err)
    }
  },
}

// One-time migration: if this device still has the old localStorage blob
// from before IndexedDB, copy it into IDB and then delete it from
// localStorage so the 5 MB quota is freed. Runs once at module load.
// Idempotent — re-running is a no-op.
const LS_KEY = 'menu-planner-store'
export async function migrateFromLocalStorage() {
  try {
    if (typeof localStorage === 'undefined') return
    const legacy = localStorage.getItem(LS_KEY)
    if (!legacy) return
    const existing = await get(LS_KEY, store)
    if (!existing) {
      await set(LS_KEY, legacy, store)
      console.info('[idbStorage] migrated legacy localStorage payload to IndexedDB')
    }
    localStorage.removeItem(LS_KEY)
  } catch (err) {
    console.warn('[idbStorage] migration skipped', err)
  }
}
