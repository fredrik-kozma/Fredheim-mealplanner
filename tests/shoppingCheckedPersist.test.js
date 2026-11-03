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

describe('shopping id key round-trip (pipe in dictionary ids)', () => {
  it('JSON round-trip preserves ids that contain |', () => {
    const ids = ['#garlic|mass__g', '#onion|mass__kg', 'batch__#salt|mass__g'].sort()
    const key = JSON.stringify(ids)
    const restored = new Set(JSON.parse(key))
    assert.equal(restored.size, 3)
    assert.ok(restored.has('#garlic|mass__g'))
    assert.ok(restored.has('#onion|mass__kg'))
  })

  it('joining on | shatters dictionary ids and would wipe ticks (the real bug)', () => {
    const ids = ['#garlic|mass__g', '#onion|mass__kg'].sort()
    const broken = new Set(ids.join('|').split('|'))
    assert.equal(broken.has('#garlic|mass__g'), false)
    assert.ok(broken.has('#garlic'))
    assert.ok(broken.has('mass__g'))
    const map = { '#garlic|mass__g': true, '#onion|mass__kg': true }
    assert.deepEqual(pruneIdMap(map, broken), {})
    // Fixed path keeps them:
    assert.deepEqual(pruneIdMap(map, new Set(JSON.parse(JSON.stringify(ids)))), map)
  })
})
