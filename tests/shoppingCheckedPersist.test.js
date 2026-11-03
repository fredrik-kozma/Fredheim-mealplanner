import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pruneIdMap } from '../src/utils/pruneIdMap.js'

describe('pruneIdMap (shopping checked/dismissed persistence)', () => {
  it('keeps the map when validIds is empty (list not ready yet)', () => {
    const map = { a__g: true, b__ml: true }
    assert.equal(pruneIdMap(map, new Set()), map)
    assert.equal(pruneIdMap(map, null), map)
    assert.equal(pruneIdMap(map, undefined), map)
  })

  it('drops keys that left the list and keeps the rest', () => {
    const map = { a__g: true, b__ml: true, c__g: false }
    const next = pruneIdMap(map, new Set(['a__g', 'c__g']))
    assert.deepEqual(next, { a__g: true, c__g: false })
    assert.notEqual(next, map)
  })

  it('returns the same object when nothing changed', () => {
    const map = { a__g: true }
    assert.equal(pruneIdMap(map, new Set(['a__g'])), map)
  })
})
