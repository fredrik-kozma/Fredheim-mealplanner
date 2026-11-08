/**
 * Optional journal: phases, check-ins, personal notes, and a manual
 * reintroduction plan.
 *
 * Nothing here diagnoses an intolerance or writes the app's blocked
 * ingredients. Restrictive phases stay closed unless the eligibility
 * answers allow them. Logging stays available when restriction is not.
 * Phase changes happen only when a function below is called.
 */

export const PHASES = ['off', 'baseline', 'trial', 'review', 'reintroduction', 'personalisation']
export const OUTCOMES = ['tolerated', 'unclear', 'limit']
export const PAIN_LEVELS = ['none', 'mild', 'moderate', 'severe']
export const STOOL = ['harder', 'usual', 'looser']
export const TRIAL_MIN_DAYS = 14
export const TRIAL_MAX_DAYS = 42

const RED_FLAGS = ['weightLoss', 'bleeding', 'lump', 'pallor']

export function emptyEligibility() {
  return {
    disclaimerAck: false,
    adultAssessedIbs: false,
    pregnant: false,
    child: false,
    eatingConcern: false,
    redFlags: { weightLoss: false, bleeding: false, lump: false, pallor: false },
    coeliacAck: false,
    noHomeAllergyChallenge: false,
  }
}

export function emptyJournal() {
  return {
    version: 1,
    enabled: false,
    eligibility: emptyEligibility(),
    phase: 'off',
    phaseLog: [],
    trial: {
      startedOn: null,
      reviewOn: null,
      reviewedAt: null,
      symptomChange: null,
      lastPrompt: null,
    },
    checkIns: [],
    tolerances: [],
    undo: null,
    challenges: [],
  }
}

export function restrictionBlock(eligibility) {
  const e = eligibility || emptyEligibility()
  if (!e.disclaimerAck) return 'disclaimer'
  if (e.pregnant) return 'pregnancy'
  if (e.child) return 'child'
  if (e.eatingConcern) return 'eating-concern'
  if (RED_FLAGS.some(k => e.redFlags?.[k])) return 'red-flag'
  if (!e.adultAssessedIbs) return 'not-adult-assessed-ibs'
  if (!e.coeliacAck) return 'coeliac'
  if (!e.noHomeAllergyChallenge) return 'allergy-challenge'
  return null
}

export function canRestrict(state) {
  if (!state?.enabled) return { ok: false, reason: 'disabled' }
  const reason = restrictionBlock(state.eligibility)
  return reason ? { ok: false, reason } : { ok: true, reason: null }
}

function withLog(state, phase, at) {
  return {
    ...state,
    phase,
    phaseLog: [...(state.phaseLog || []), { phase, at }],
  }
}

export function enableJournal(state, at) {
  if (state.enabled) return state
  return { ...state, enabled: true, phaseLog: [...state.phaseLog, { phase: 'enabled', at }] }
}

export function setEligibility(state, patch) {
  const prev = state.eligibility || emptyEligibility()
  const redFlags = { ...prev.redFlags, ...(patch?.redFlags || {}) }
  for (const key of RED_FLAGS) redFlags[key] = Boolean(redFlags[key])
  return {
    ...state,
    eligibility: {
      ...prev,
      ...patch,
      redFlags,
      disclaimerAck: Boolean(patch?.disclaimerAck ?? prev.disclaimerAck),
      adultAssessedIbs: Boolean(patch?.adultAssessedIbs ?? prev.adultAssessedIbs),
      pregnant: Boolean(patch?.pregnant ?? prev.pregnant),
      child: Boolean(patch?.child ?? prev.child),
      eatingConcern: Boolean(patch?.eatingConcern ?? prev.eatingConcern),
      coeliacAck: Boolean(patch?.coeliacAck ?? prev.coeliacAck),
      noHomeAllergyChallenge: Boolean(patch?.noHomeAllergyChallenge ?? prev.noHomeAllergyChallenge),
    },
  }
}

export function startBaseline(state, at) {
  if (!state.enabled) return { ok: false, reason: 'disabled', state }
  return { ok: true, state: withLog(state, 'baseline', at) }
}

export function calendarDate(value) {
  if (typeof value !== 'string') return null
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value)
  if (!match) return null
  const [y, m, d] = match[1].split('-').map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const utc = new Date(Date.UTC(y, m - 1, d))
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d) return null
  return match[1]
}

export function daysBetween(start, end) {
  const a = calendarDate(start)
  const b = calendarDate(end)
  if (!a || !b) return null
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)
  return Math.round(ms / 86400000)
}

export function localDateOfInput(value) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value || '')
  if (!match) return null
  const hh = Number(match[2])
  const mm = Number(match[3])
  if (hh > 23 || mm > 59) return null
  return calendarDate(match[1])
}

/** Calendar date of an instant in an IANA time zone. */
export function localDateInZone(iso, timeZone) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return calendarDate(fmt.format(date))
}

export function startTrial(state, { startedOn, reviewOn, at }) {
  const gate = canRestrict(state)
  if (!gate.ok) return { ok: false, reason: gate.reason, state }
  const start = calendarDate(startedOn)
  const review = calendarDate(reviewOn)
  const span = daysBetween(start, review)
  if (!start || span == null || span < TRIAL_MIN_DAYS || span > TRIAL_MAX_DAYS) {
    return { ok: false, reason: 'review-window', state }
  }
  return {
    ok: true,
    state: withLog({
      ...state,
      trial: {
        startedOn: start,
        reviewOn: review,
        reviewedAt: null,
        symptomChange: null,
        lastPrompt: null,
      },
    }, 'trial', at),
  }
}

export function reviewIsDue(state, today) {
  if (state?.phase !== 'trial' || !state.trial?.reviewOn) return false
  const day = calendarDate(today)
  if (!day) return false
  return day >= state.trial.reviewOn
}

export function openReview(state, at) {
  if (!state.enabled || state.phase !== 'trial') return { ok: false, reason: 'not-in-trial', state }
  return { ok: true, state: withLog(state, 'review', at) }
}

/**
 * improved → stay at the review step; reintroduction is a separate choice.
 * not-improved or unsure → stop the trial. Do not tighten anything.
 * later → stay in the trial, record that there is no answer, do not move
 * the review date and do not add a stricter rule.
 */
export function submitReview(state, outcome, at) {
  if (state.phase !== 'trial' && state.phase !== 'review') {
    return { ok: false, reason: 'not-in-review', state }
  }
  if (outcome === 'later') {
    return {
      ok: true,
      state: {
        ...state,
        phase: 'trial',
        trial: { ...state.trial, symptomChange: null, lastPrompt: 'no-response' },
      },
    }
  }
  if (outcome === 'not-improved' || outcome === 'unsure') {
    return {
      ok: true,
      state: withLog({
        ...state,
        trial: {
          ...state.trial,
          symptomChange: outcome,
          reviewedAt: at,
          lastPrompt: 'reassess',
        },
      }, 'off', at),
    }
  }
  if (outcome === 'improved') {
    return {
      ok: true,
      state: withLog({
        ...state,
        trial: { ...state.trial, symptomChange: 'improved', reviewedAt: at, lastPrompt: null },
      }, 'review', at),
    }
  }
  return { ok: false, reason: 'bad-outcome', state }
}

export function startReintroduction(state, at) {
  const gate = canRestrict(state)
  if (!gate.ok) return { ok: false, reason: gate.reason, state }
  if (state.phase !== 'review' || state.trial?.symptomChange !== 'improved') {
    return { ok: false, reason: 'review-first', state }
  }
  return { ok: true, state: withLog(state, 'reintroduction', at) }
}

export function startPersonalisation(state, at) {
  if (!state.enabled) return { ok: false, reason: 'disabled', state }
  if (state.phase !== 'reintroduction' && state.phase !== 'review') {
    return { ok: false, reason: 'not-ready', state }
  }
  return { ok: true, state: withLog(state, 'personalisation', at) }
}

export function stopJourney(state, at) {
  return { ok: true, state: withLog(state, 'off', at) }
}

let seq = 0
export function createId(prefix, now = Date.now()) {
  seq += 1
  return `${prefix}-${now.toString(36)}-${seq.toString(36)}`
}

function clip(value, max) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export function addCheckIn(state, input, { id, timeZone } = {}) {
  if (!state.enabled) return { ok: false, reason: 'disabled', state }
  const food = clip(input?.food, 200)
  if (!food) return { ok: false, reason: 'food', state }
  const at = typeof input?.at === 'string' ? input.at : ''
  const localDate = input?.localDate
    ? calendarDate(input.localDate)
    : (localDateOfInput(at) || (timeZone ? localDateInZone(at, timeZone) : null))
  if (!localDate) return { ok: false, reason: 'time', state }

  let amount = null
  if (input?.amount != null && input.amount !== '') {
    amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'amount', state }
  }
  const unit = clip(input?.unit, 20)
  if (amount != null && !unit) return { ok: false, reason: 'unit', state }

  const pain = input?.pain ?? null
  if (pain != null && !PAIN_LEVELS.includes(pain)) return { ok: false, reason: 'pain', state }
  const bloating = input?.bloating ?? null
  if (bloating != null && !PAIN_LEVELS.includes(bloating)) return { ok: false, reason: 'bloating', state }
  const stool = input?.stool ?? null
  if (stool != null && !STOOL.includes(stool)) return { ok: false, reason: 'stool', state }

  const ingredientId = typeof input?.ingredientId === 'string' && input.ingredientId.trim()
    ? input.ingredientId.trim()
    : null

  const checkIn = {
    id: id || createId('checkin'),
    at,
    localDate,
    phase: state.phase,
    food,
    ingredientId,
    preparation: clip(input?.preparation, 80),
    amount,
    unit,
    pain,
    bloating,
    stool,
    notes: clip(input?.notes, 500),
  }
  return { ok: true, state: { ...state, checkIns: [...state.checkIns, checkIn] }, checkIn }
}

export function checkInsOnDate(state, date) {
  const day = calendarDate(date)
  if (!day) return []
  return (state.checkIns || []).filter(c => c.localDate === day)
}

export function deleteCheckIn(state, id) {
  return { ...state, checkIns: state.checkIns.filter(c => c.id !== id) }
}

function readTolerance(input, id) {
  const foodLabel = clip(input?.foodLabel, 200)
  const ingredientId = typeof input?.ingredientId === 'string' ? input.ingredientId.trim() : ''
  const preparation = clip(input?.preparation, 80)
  const amount = Number(input?.amount)
  const unit = clip(input?.unit, 20)
  if (!foodLabel || !ingredientId || !preparation) return { ok: false, reason: 'food' }
  if (!Number.isFinite(amount) || amount <= 0 || !unit) return { ok: false, reason: 'amount' }
  if (!OUTCOMES.includes(input?.outcome)) return { ok: false, reason: 'outcome' }
  return {
    ok: true,
    record: {
      id,
      foodLabel,
      ingredientId,
      preparation,
      amount,
      unit,
      outcome: input.outcome,
      notes: clip(input?.notes, 500),
      source: 'user-observation',
      updatedAt: input?.at || null,
    },
  }
}

function rememberUndo(state) {
  return { kind: 'tolerances', tolerances: state.tolerances }
}

export function addTolerance(state, input, { id } = {}) {
  const read = readTolerance(input, id || createId('tol'))
  if (!read.ok) return { ok: false, reason: read.reason, state }
  return {
    ok: true,
    state: {
      ...state,
      undo: rememberUndo(state),
      tolerances: [...state.tolerances, read.record],
    },
  }
}

export function updateTolerance(state, id, input) {
  const prev = state.tolerances.find(t => t.id === id)
  if (!prev) return { ok: false, reason: 'missing', state }
  const read = readTolerance({ ...prev, ...input, at: input?.at || prev.updatedAt }, id)
  if (!read.ok) return { ok: false, reason: read.reason, state }
  return {
    ok: true,
    state: {
      ...state,
      undo: rememberUndo(state),
      tolerances: state.tolerances.map(t => t.id === id ? read.record : t),
    },
  }
}

export function deleteTolerance(state, id) {
  if (!state.tolerances.some(t => t.id === id)) return { ok: false, reason: 'missing', state }
  return {
    ok: true,
    state: {
      ...state,
      undo: rememberUndo(state),
      tolerances: state.tolerances.filter(t => t.id !== id),
    },
  }
}

export function undoToleranceChange(state) {
  if (!state.undo || state.undo.kind !== 'tolerances' || !Array.isArray(state.undo.tolerances)) {
    return { ok: false, reason: 'nothing', state }
  }
  return { ok: true, state: { ...state, tolerances: state.undo.tolerances, undo: null } }
}

function blankDoses() {
  return [1, 2, 3].map(day => ({ day, amountText: '', unit: '' }))
}

export function addChallenge(state, input, { id } = {}) {
  const gate = canRestrict(state)
  if (!gate.ok) return { ok: false, reason: gate.reason, state }
  if (state.phase !== 'reintroduction') return { ok: false, reason: 'phase', state }
  const foodLabel = clip(input?.foodLabel, 200)
  const preparation = clip(input?.preparation, 80)
  if (!foodLabel || !preparation) return { ok: false, reason: 'food', state }
  if ((state.challenges || []).some(c => c.status === 'active')) {
    return { ok: false, reason: 'one-at-a-time', state }
  }
  const doses = blankDoses().map(slot => {
    const from = (input?.doses || []).find(d => d.day === slot.day) || {}
    return {
      day: slot.day,
      amountText: clip(from.amountText, 40),
      unit: clip(from.unit, 20),
    }
  })
  const challenge = {
    id: id || createId('challenge'),
    foodLabel,
    ingredientId: typeof input?.ingredientId === 'string' && input.ingredientId.trim()
      ? input.ingredientId.trim()
      : null,
    preparation,
    doses,
    status: 'active',
    guidanceSource: 'user-defined',
    unreviewed: true,
    protocolId: null,
    userOutcome: null,
    notes: clip(input?.notes, 500),
  }
  return { ok: true, state: { ...state, challenges: [...state.challenges, challenge] } }
}

export function updateChallengeDoses(state, id, doses) {
  const current = state.challenges.find(c => c.id === id)
  if (!current) return { ok: false, reason: 'missing', state }
  const next = blankDoses().map(slot => {
    const from = (doses || []).find(d => d.day === slot.day) || current.doses.find(d => d.day === slot.day)
    return {
      day: slot.day,
      amountText: clip(from?.amountText, 40),
      unit: clip(from?.unit, 20),
    }
  })
  return {
    ok: true,
    state: {
      ...state,
      challenges: state.challenges.map(c => c.id === id ? {
        ...c,
        doses: next,
        guidanceSource: 'user-defined',
        unreviewed: true,
        protocolId: null,
      } : c),
    },
  }
}

export function stopChallenge(state, id) {
  const current = state.challenges.find(c => c.id === id)
  if (!current || current.status !== 'active') return { ok: false, reason: 'missing', state }
  return {
    ok: true,
    state: {
      ...state,
      challenges: state.challenges.map(c => c.id === id ? { ...c, status: 'stopped' } : c),
    },
  }
}

export function recordChallengeOutcome(state, id, outcome) {
  if (!OUTCOMES.includes(outcome)) return { ok: false, reason: 'outcome', state }
  const current = state.challenges.find(c => c.id === id)
  if (!current) return { ok: false, reason: 'missing', state }
  return {
    ok: true,
    state: {
      ...state,
      challenges: state.challenges.map(c => c.id === id ? {
        ...c,
        status: 'done',
        userOutcome: outcome,
        guidanceSource: 'user-defined',
        unreviewed: true,
        protocolId: null,
      } : c),
    },
  }
}

export function deleteChallenge(state, id) {
  return { ...state, challenges: state.challenges.filter(c => c.id !== id) }
}

export function resetJourney(state) {
  const fresh = emptyJournal()
  return {
    ...fresh,
    enabled: state.enabled,
    eligibility: state.eligibility,
  }
}

function bool(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

/** Drop anything that is not a journal we wrote. Does not keep a dataset. */
export function normalizeJournal(raw) {
  const empty = emptyJournal()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty
  const eligibility = emptyEligibility()
  const from = raw.eligibility && typeof raw.eligibility === 'object' ? raw.eligibility : {}
  eligibility.disclaimerAck = bool(from.disclaimerAck)
  eligibility.adultAssessedIbs = bool(from.adultAssessedIbs)
  eligibility.pregnant = bool(from.pregnant)
  eligibility.child = bool(from.child)
  eligibility.eatingConcern = bool(from.eatingConcern)
  eligibility.coeliacAck = bool(from.coeliacAck)
  eligibility.noHomeAllergyChallenge = bool(from.noHomeAllergyChallenge)
  for (const key of RED_FLAGS) eligibility.redFlags[key] = bool(from.redFlags?.[key])

  const phase = PHASES.includes(raw.phase) ? raw.phase : 'off'
  const checkIns = Array.isArray(raw.checkIns) ? raw.checkIns.filter(isCheckIn) : []
  const tolerances = Array.isArray(raw.tolerances) ? raw.tolerances.filter(isTolerance) : []
  const challenges = Array.isArray(raw.challenges) ? raw.challenges.filter(isChallenge).map(sealChallenge) : []
  const trial = raw.trial && typeof raw.trial === 'object' ? raw.trial : {}

  return {
    version: 1,
    enabled: bool(raw.enabled),
    eligibility,
    phase,
    phaseLog: Array.isArray(raw.phaseLog) ? raw.phaseLog.filter(e => e && typeof e.phase === 'string' && typeof e.at === 'string').slice(-100) : [],
    trial: {
      startedOn: calendarDate(trial.startedOn),
      reviewOn: calendarDate(trial.reviewOn),
      reviewedAt: typeof trial.reviewedAt === 'string' ? trial.reviewedAt : null,
      symptomChange: ['improved', 'not-improved', 'unsure'].includes(trial.symptomChange) ? trial.symptomChange : null,
      lastPrompt: ['no-response', 'reassess'].includes(trial.lastPrompt) ? trial.lastPrompt : null,
    },
    checkIns,
    tolerances,
    undo: raw.undo?.kind === 'tolerances' && Array.isArray(raw.undo.tolerances)
      ? { kind: 'tolerances', tolerances: raw.undo.tolerances.filter(isTolerance) }
      : null,
    challenges,
  }
}

function isCheckIn(c) {
  return Boolean(c && typeof c.id === 'string' && typeof c.food === 'string' && calendarDate(c.localDate) && PHASES.includes(c.phase))
}

function isTolerance(t) {
  return Boolean(
    t &&
    typeof t.id === 'string' &&
    typeof t.ingredientId === 'string' &&
    typeof t.preparation === 'string' &&
    typeof t.foodLabel === 'string' &&
    typeof t.amount === 'number' &&
    t.amount > 0 &&
    typeof t.unit === 'string' &&
    OUTCOMES.includes(t.outcome) &&
    t.source === 'user-observation'
  )
}

function isChallenge(c) {
  return Boolean(c && typeof c.id === 'string' && typeof c.foodLabel === 'string' && typeof c.preparation === 'string')
}

function sealChallenge(c) {
  const doses = blankDoses().map(slot => {
    const from = (c.doses || []).find(d => d && d.day === slot.day) || {}
    return { day: slot.day, amountText: clip(from.amountText, 40), unit: clip(from.unit, 20) }
  })
  return {
    id: c.id,
    foodLabel: clip(c.foodLabel, 200),
    ingredientId: typeof c.ingredientId === 'string' ? c.ingredientId : null,
    preparation: clip(c.preparation, 80),
    doses,
    status: ['active', 'stopped', 'done', 'planned'].includes(c.status) ? c.status : 'planned',
    guidanceSource: 'user-defined',
    unreviewed: true,
    protocolId: null,
    userOutcome: OUTCOMES.includes(c.userOutcome) ? c.userOutcome : null,
    notes: clip(c.notes, 500),
  }
}
