/**
 * Local "Missing ingredient? Tell us" requests.
 * Stored in localStorage — no Supabase writes by default (free-plan safe).
 *
 * Options reported in README:
 *  A) localStorage only + export JSON (implemented)
 *  B) append to existing profiles.preferences JSON column if present (optional hook)
 *  C) mailto: Fredrik with the export (UI can offer)
 */

const KEY = 'fredheim:missing-ingredient-requests'
const MAX = 200

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function write(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX)))
}

export function listMissingIngredientRequests() {
  return read()
}

export function addMissingIngredientRequest({ name, note, lang, recipeTitle }) {
  const item = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: String(name || '').trim(),
    note: note ? String(note).trim() : '',
    lang: lang || 'en',
    recipeTitle: recipeTitle || '',
    createdAt: new Date().toISOString(),
  }
  if (!item.name) return null
  const next = [...read(), item]
  write(next)
  return item
}

export function clearMissingIngredientRequests() {
  write([])
}

export function exportMissingIngredientRequests() {
  return JSON.stringify(read(), null, 2)
}
