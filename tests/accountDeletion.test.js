import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  initialLegalLang,
  privacyCopy,
  deletionCopy,
  SELLER,
} from '../src/content/legalCopy.js'
import {
  LOCAL_STORAGE_KEYS,
  SESSION_STORAGE_KEYS,
  IDB_STORE_KEY,
  clearLocalAccountData,
} from '../src/utils/clearLocalAccountData.js'

const require = createRequire(import.meta.url)
const {
  CONFIRM_PHRASE,
  bearerToken,
  assessDeleteRequest,
  subscriptionIdsToCancel,
} = require(join(
  dirname(fileURLToPath(import.meta.url)),
  '../netlify/functions/lib/deleteAccountLogic.cjs',
))

function flat(copy) {
  const chunks = [copy.title, copy.intro, copy.updated]
  if (copy.sections) {
    for (const section of copy.sections) {
      chunks.push(section.title, ...section.paragraphs)
    }
  }
  for (const key of ['steps', 'deleted', 'kept', 'billing', 'emailFallback']) {
    const value = copy[key]
    if (typeof value === 'string') chunks.push(value)
    else if (Array.isArray(value)) chunks.push(...value)
  }
  return chunks.join('\n')
}

describe('delete-account request gate', () => {
  it('requires POST, the word DELETE, and a bearer token', () => {
    assert.equal(CONFIRM_PHRASE, 'DELETE')
    assert.deepEqual(
      assessDeleteRequest({ method: 'GET', authorization: 'Bearer abc', body: '{"confirm":"DELETE"}' }),
      { ok: false, status: 405, error: 'Method not allowed' },
    )
    assert.equal(
      assessDeleteRequest({ method: 'POST', authorization: 'Bearer abc', body: '{' }).status,
      400,
    )
    assert.equal(
      assessDeleteRequest({ method: 'POST', authorization: 'Bearer abc', body: '{}' }).status,
      400,
    )
    assert.equal(
      assessDeleteRequest({ method: 'POST', authorization: '', body: '{"confirm":"DELETE"}' }).status,
      401,
    )
    const ok = assessDeleteRequest({
      method: 'POST',
      authorization: 'Bearer session-token',
      body: '{"confirm":"DELETE"}',
    })
    assert.equal(ok.ok, true)
    assert.equal(ok.token, 'session-token')
  })

  it('reads a bearer token and ignores other schemes', () => {
    assert.equal(bearerToken('Bearer abc.def'), 'abc.def')
    assert.equal(bearerToken('bearer abc.def'), 'abc.def')
    assert.equal(bearerToken('Basic abc'), '')
    assert.equal(bearerToken(undefined), '')
  })

  it('cancels only subscriptions that can still bill', () => {
    const ids = subscriptionIdsToCancel([
      { id: 'sub_active', status: 'active' },
      { id: 'sub_trial', status: 'trialing' },
      { id: 'sub_past', status: 'past_due' },
      { id: 'sub_paused', status: 'paused' },
      { id: 'sub_done', status: 'canceled' },
      { id: 'sub_dead', status: 'incomplete_expired' },
      { status: 'active' },
      null,
    ])
    assert.deepEqual(ids, ['sub_active', 'sub_trial', 'sub_past', 'sub_paused'])
  })
})

describe('local account data', () => {
  it('clears the plan store and the preference keys', async () => {
    const removed = []
    const local = { removeItem: (key) => removed.push(`local:${key}`) }
    const session = { removeItem: (key) => removed.push(`session:${key}`) }
    const idb = { removeItem: async (key) => { removed.push(`idb:${key}`) } }
    await clearLocalAccountData({ localStorage: local, sessionStorage: session, storage: idb })
    for (const key of LOCAL_STORAGE_KEYS) assert.ok(removed.includes(`local:${key}`))
    for (const key of SESSION_STORAGE_KEYS) assert.ok(removed.includes(`session:${key}`))
    assert.ok(removed.includes(`idb:${IDB_STORE_KEY}`))
    assert.ok(LOCAL_STORAGE_KEYS.includes('menu-planner-store'))
  })
})

describe('public legal copy', () => {
  it('defaults the public pages to English', () => {
    assert.equal(initialLegalLang('', null), 'en')
    assert.equal(initialLegalLang('?lang=no', null), 'no')
    assert.equal(initialLegalLang('', 'sv'), 'sv')
    assert.equal(initialLegalLang('?lang=en', 'no'), 'en')
  })

  it('covers what Play Console needs, in English', () => {
    const text = flat(privacyCopy.en)
    const required = [
      'plant-based meal planner',
      'Supabase',
      'Stripe',
      'Google Play',
      'RevenueCat',
      'IndexedDB',
      'General guidance, not personal medical advice',
      'children under 13',
      'KOZMA VIVERA HEALTH',
      'Bergmannsveien 600',
      '3614 Kongsberg',
      SELLER.email,
      SELLER.deleteUrl,
      'Subscription billing is handled by Stripe',
      'without creating an account',
      'anonymous app user ID',
      'only when you sign in',
      'purchase history and subscription status',
    ]
    for (const phrase of required) assert.ok(text.includes(phrase), phrase)
  })

  it('states the same facts in Norwegian', () => {
    const text = flat(privacyCopy.no)
    for (const phrase of ['Supabase', 'Stripe', 'Google Play', 'IndexedDB', 'under 13', 'KOZMA VIVERA HEALTH', 'Bergmannsveien 600', SELLER.email]) {
      assert.ok(text.includes(phrase), phrase)
    }
    assert.ok(text.includes('plantebasert'))
  })

  it('explains deletion without hiding it behind a login', () => {
    const text = flat(deletionCopy.en)
    for (const phrase of [
      'Type DELETE',
      'Supabase',
      'IndexedDB',
      'Google Play',
      'Stripe',
      SELLER.email,
      SELLER.deleteUrl,
      'does not cancel a Google Play subscription',
      'people who created a Fredheim Meal Planner account',
    ]) {
      assert.ok(text.includes(phrase), phrase)
    }
    assert.match(deletionCopy.en.noAccount, /clear its data/)
    assert.match(deletionCopy.en.noAccount, /Manage a Google Play subscription in Google Play/)
    assert.match(deletionCopy.no.noAccount, /tøm appdataene/)
    assert.match(deletionCopy.sv.noAccount, /rensa dess data/)
    assert.equal(deletionCopy.en.steps.length, 4)
  })
})

describe('routes and settings links', () => {
  it('publishes /privacy and /delete-account outside the paywall', () => {
    const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
    assert.match(app, /path="\/privacy"/)
    assert.match(app, /path="\/delete-account"/)
    const privacyAt = app.indexOf('path="/privacy"')
    const gateAt = app.indexOf('path="/*"')
    assert.ok(privacyAt > -1 && privacyAt < gateAt)
  })

  it('links both pages from Settings and the account menu', () => {
    const settings = readFileSync(new URL('../src/pages/SettingsPage.jsx', import.meta.url), 'utf8')
    const header = readFileSync(new URL('../src/components/layout/Header.jsx', import.meta.url), 'utf8')
    const wall = readFileSync(new URL('../src/components/subscription/UpgradeWall.jsx', import.meta.url), 'utf8')
    for (const src of [settings, header, wall]) {
      assert.match(src, /to="\/privacy"/)
      assert.match(src, /to="\/delete-account"/)
    }
  })

  it('sends the confirmation phrase the server requires', () => {
    const page = readFileSync(new URL('../src/pages/DeleteAccountPage.jsx', import.meta.url), 'utf8')
    assert.match(page, /confirm:\s*'DELETE'/)
    assert.match(page, /Authorization:\s*`Bearer \$\{token\}`/)
    assert.match(page, /\/\.netlify\/functions\/delete-account/)
  })
})
