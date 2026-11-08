/**
 * On-device journal. A separate IndexedDB key from the meal-plan store,
 * so it is not part of the backup file and it is not sent anywhere.
 * Saves do not log the contents.
 */

import { get, set, del, createStore } from 'idb-keyval'
import { emptyJournal, normalizeJournal } from './journal.js'

export const FODMAP_IDB_KEY = 'fredheim-fodmap-journal'

const db = createStore('menu-planner-db', 'keyval')

const defaultAdapter = {
  getItem: async (key) => {
    const value = await get(key, db)
    return value ?? null
  },
  setItem: async (key, value) => {
    await set(key, value, db)
  },
  removeItem: async (key) => {
    await del(key, db)
  },
}

export async function loadJournal(adapter = defaultAdapter) {
  try {
    const raw = await adapter.getItem(FODMAP_IDB_KEY)
    if (raw == null) return emptyJournal()
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return normalizeJournal(parsed)
  } catch {
    return emptyJournal()
  }
}

export async function saveJournal(state, adapter = defaultAdapter) {
  const safe = normalizeJournal(state)
  try {
    await adapter.setItem(FODMAP_IDB_KEY, JSON.stringify(safe))
  } catch {
    // Keep the in-memory copy. Do not report the journal contents.
  }
  return safe
}

export async function clearJournal(adapter = defaultAdapter) {
  const fresh = emptyJournal()
  try {
    await adapter.removeItem(FODMAP_IDB_KEY)
  } catch {
    // The caller still drops the in-memory copy.
  }
  return fresh
}
