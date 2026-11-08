import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/common/PageHeader'
import { FODMAP_SOURCES } from '../utils/fodmap/sources'
import { considerDatasetForPlanning } from '../utils/fodmap/dataset'
import { productionPlanningDataset } from '../utils/fodmap/planning'
import {
  addChallenge, addCheckIn, addTolerance, canRestrict,   deleteCheckIn, deleteTolerance, enableJournal, localDateOfInput, openReview, recordChallengeOutcome,
  emptyJournal, resetJourney, restrictionBlock, reviewIsDue, setEligibility, startBaseline, startPersonalisation,
  startReintroduction, startTrial, stopChallenge, stopJourney, submitReview, undoToleranceChange,
  updateTolerance, TRIAL_MIN_DAYS, TRIAL_MAX_DAYS,
} from '../utils/fodmap/journal'
import { clearJournal, loadJournal, saveJournal } from '../utils/fodmap/storage'

const LEVELS = ['none', 'mild', 'moderate', 'severe']
const STOOL = ['harder', 'usual', 'looser']
const UNITS = ['g', 'ml', 'tsp', 'tbsp', 'pcs', 'clove']

function todayDate() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function plusDays(date, days) {
  const [y, m, d] = date.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d + days))
  return utc.toISOString().slice(0, 10)
}

function nowLocalInput() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export default function FodmapPage() {
  const { t } = useTranslation()
  const [journal, setJournal] = useState(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(null)

  useEffect(() => {
    let live = true
    loadJournal().then(value => { if (live) setJournal(value) })
    return () => { live = false }
  }, [])

  async function commit(next) {
    const saved = await saveJournal(next)
    setJournal(saved)
    return saved
  }

  if (!journal) {
    return (
      <div className="max-w-lg mx-auto pb-nav lg:pb-8 px-4">
        <PageHeader title={t('fodmap.title')} subtitle={t('fodmap.subtitle')} />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-nav lg:pb-8">
      <PageHeader
        title={t('fodmap.title')}
        subtitle={t('fodmap.subtitle')}
        actions={<Link to="/settings" className="btn-secondary btn-sm">{t('fodmap.back')}</Link>}
      />
      <div className="px-4 space-y-4">
        {!journal.enabled ? (
          <Intro onEnable={() => commit(enableJournal(journal, new Date().toISOString()))} />
        ) : (
          <JournalBody
            journal={journal}
            commit={commit}
            error={error}
            setError={setError}
            pending={pending}
            setPending={setPending}
          />
        )}
      </div>
    </div>
  )
}

function Intro({ onEnable }) {
  const { t } = useTranslation()
  return (
    <section className="card p-5 space-y-3">
      <p className="text-sm text-slate-700 leading-relaxed">{t('fodmap.offLead')}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{t('fodmap.offCannot')}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{t('fodmap.support')}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{t('fodmap.enabledNote')}</p>
      <SourceList />
      <button type="button" className="btn-primary w-full" onClick={onEnable}>{t('fodmap.enable')}</button>
    </section>
  )
}

function JournalBody({ journal, commit, error, setError, pending, setPending }) {
  const { t } = useTranslation()
  const block = restrictionBlock(journal.eligibility)
  const gate = canRestrict(journal)
  const mealsReady = productionPlanningDataset() != null
  const today = todayDate()
  const due = reviewIsDue(journal, today)

  function run(result) {
    if (!result.ok) {
      setError(result.reason || 'save')
      return
    }
    setError('')
    commit(result.state)
  }

  return (
    <>
      <section className="card p-5 space-y-2" aria-labelledby="fodmap-gap">
        <h2 id="fodmap-gap" className="text-sm font-semibold text-slate-900">{t('fodmap.dataGapTitle')}</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          {mealsReady ? t('fodmap.mmwReady') : t('fodmap.dataGapBody')}
        </p>
        <p className="text-xs text-slate-500">{t('fodmap.disclaimer')}</p>
      </section>

      {(block === 'red-flag' || block === 'pregnancy' || block === 'child') && (
        <p className="text-sm text-danger-800 bg-danger-50 border border-danger-200 rounded-control px-3 py-3 leading-relaxed" role="status">
          {t(`fodmap.block.${block}`)}
        </p>
      )}

      <Eligibility journal={journal} commit={commit} />

      <section className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">{t('fodmap.phaseTitle')}</h2>
        <p className="text-sm text-slate-700">{t(`fodmap.phase.${journal.phase}`)}</p>
        {journal.phase === 'off' && (
          <button type="button" className="btn-secondary w-full" onClick={() => run(startBaseline(journal, new Date().toISOString()))}>
            {t('fodmap.startBaseline')}
          </button>
        )}
        {journal.phase === 'baseline' && (
          <TrialStart journal={journal} gate={gate} onStart={run} />
        )}
        {(journal.phase === 'trial' || journal.phase === 'review' || due) && (
          <Review journal={journal} due={due} onRun={run} />
        )}
        {journal.phase === 'review' && journal.trial.symptomChange === 'improved' && (
          <button type="button" className="btn-primary w-full" disabled={!gate.ok} onClick={() => run(startReintroduction(journal, new Date().toISOString()))}>
            {t('fodmap.startReintro')}
          </button>
        )}
        {(journal.phase === 'review' || journal.phase === 'reintroduction') && (
          <button type="button" className="btn-secondary w-full" onClick={() => run(startPersonalisation(journal, new Date().toISOString()))}>
            {t('fodmap.toNotes')}
          </button>
        )}
        {journal.phase !== 'off' && (
          <button type="button" className="btn-secondary w-full" onClick={() => run(stopJourney(journal, new Date().toISOString()))}>
            {t('fodmap.stop')}
          </button>
        )}
        {!gate.ok && journal.phase !== 'trial' && (
          <p className="text-xs text-slate-600 leading-relaxed">{t(`fodmap.block.${gate.reason}`, { defaultValue: t('fodmap.blockAck') })} {t('fodmap.logAnyway')}</p>
        )}
        {journal.trial.lastPrompt === 'no-response' && <p className="text-xs text-slate-600 leading-relaxed">{t('fodmap.laterNote')}</p>}
        {journal.trial.lastPrompt === 'reassess' && <p className="text-xs text-slate-600 leading-relaxed">{t('fodmap.reassessNote')}</p>}
        {error && <p className="text-xs text-danger-700" role="alert">{t(`fodmap.err.${error}`, { defaultValue: t('fodmap.err.save') })}</p>}
      </section>

      <CheckIn journal={journal} commit={commit} />
      <Tolerances journal={journal} commit={commit} />
      {(journal.phase === 'reintroduction' || journal.challenges.length > 0) && (
        <Reintro journal={journal} gate={gate} commit={commit} />
      )}
      <FileCheck />
      <DataControls journal={journal} commit={commit} pending={pending} setPending={setPending} />
    </>
  )
}

function Eligibility({ journal, commit }) {
  const { t } = useTranslation()
  const e = journal.eligibility
  function set(patch) {
    commit(setEligibility(journal, patch))
  }
  function flag(key) {
    set({ redFlags: { ...e.redFlags, [key]: !e.redFlags[key] } })
  }
  return (
    <fieldset className="card p-5 space-y-3">
      <legend className="text-sm font-semibold text-slate-900 px-1">{t('fodmap.eligibilityTitle')}</legend>
      <Check checked={e.adultAssessedIbs} onChange={() => set({ adultAssessedIbs: !e.adultAssessedIbs })} label={t('fodmap.adult')} />
      <Check checked={e.pregnant} onChange={() => set({ pregnant: !e.pregnant })} label={t('fodmap.pregnant')} />
      {e.pregnant && <p className="text-xs text-slate-600">{t('fodmap.block.pregnancy')} <Source id="monash-pregnancy" /></p>}
      <Check checked={e.child} onChange={() => set({ child: !e.child })} label={t('fodmap.child')} />
      {e.child && <p className="text-xs text-slate-600">{t('fodmap.block.child')} <Source id="monash-children" /></p>}
      <Check checked={e.eatingConcern} onChange={() => set({ eatingConcern: !e.eatingConcern })} label={t('fodmap.eating')} />
      {e.eatingConcern && <p className="text-xs text-slate-600 leading-relaxed">{t('fodmap.eatingNote')} <Source id="monash-eating" /></p>}
      <p className="text-xs font-medium text-slate-700 pt-1">{t('fodmap.flagsTitle')}</p>
      {['weightLoss', 'bleeding', 'lump', 'pallor'].map(key => (
        <Check key={key} checked={e.redFlags[key]} onChange={() => flag(key)} label={t(`fodmap.flag.${key}`)} />
      ))}
      <p className="text-xs text-slate-500"><Source id="nhs-symptoms" /></p>
      <Check checked={e.coeliacAck} onChange={() => set({ coeliacAck: !e.coeliacAck })} label={t('fodmap.coeliac')} />
      <Check checked={e.noHomeAllergyChallenge} onChange={() => set({ noHomeAllergyChallenge: !e.noHomeAllergyChallenge })} label={t('fodmap.allergy')} />
      <Check checked={e.disclaimerAck} onChange={() => set({ disclaimerAck: !e.disclaimerAck })} label={t('fodmap.ack')} />
    </fieldset>
  )
}

function Check({ checked, onChange, label }) {
  return (
    <label className="flex items-start gap-3 text-sm text-slate-800 leading-snug">
      <input type="checkbox" className="mt-1" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  )
}

function TrialStart({ journal, gate, onStart }) {
  const { t } = useTranslation()
  const [startedOn, setStartedOn] = useState(todayDate())
  const [reviewOn, setReviewOn] = useState(plusDays(todayDate(), 28))
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-600 leading-relaxed">{t('fodmap.baselineHint')}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{t('fodmap.trialHint')}</p>
      <label className="block text-xs text-slate-600">
        {t('fodmap.startedOn')}
        <input type="date" className="input mt-1" value={startedOn} onChange={e => setStartedOn(e.target.value)} />
      </label>
      <label className="block text-xs text-slate-600">
        {t('fodmap.reviewOn')}
        <input type="date" className="input mt-1" value={reviewOn} onChange={e => setReviewOn(e.target.value)} />
      </label>
      <p className="text-xs text-slate-500">{t('fodmap.trialWindow', { min: TRIAL_MIN_DAYS, max: TRIAL_MAX_DAYS })}</p>
      <button
        type="button"
        className="btn-primary w-full"
        disabled={!gate.ok}
        onClick={() => onStart(startTrial(journal, { startedOn, reviewOn, at: new Date().toISOString() }))}
      >
        {t('fodmap.startTrial')}
      </button>
    </div>
  )
}

function Review({ journal, due, onRun }) {
  const { t } = useTranslation()
  const at = new Date().toISOString()
  return (
    <div className="space-y-2">
      {due && journal.phase === 'trial' && <p className="text-sm text-slate-700 leading-relaxed">{t('fodmap.reviewDue')}</p>}
      {journal.phase === 'trial' && (
        <button type="button" className="btn-secondary w-full" onClick={() => onRun(openReview(journal, at))}>{t('fodmap.openReview')}</button>
      )}
      <div className="grid gap-2">
        <button type="button" className="btn-secondary w-full" onClick={() => onRun(submitReview(journal, 'improved', at))}>{t('fodmap.improved')}</button>
        <button type="button" className="btn-secondary w-full" onClick={() => onRun(submitReview(journal, 'not-improved', at))}>{t('fodmap.notImproved')}</button>
        <button type="button" className="btn-secondary w-full" onClick={() => onRun(submitReview(journal, 'unsure', at))}>{t('fodmap.unsure')}</button>
        <button type="button" className="btn-secondary w-full" onClick={() => onRun(submitReview(journal, 'later', at))}>{t('fodmap.later')}</button>
      </div>
      {journal.trial.lastPrompt === 'no-response' && <p className="text-xs text-slate-600 leading-relaxed">{t('fodmap.laterNote')}</p>}
      {journal.trial.lastPrompt === 'reassess' && <p className="text-xs text-slate-600 leading-relaxed">{t('fodmap.reassessNote')}</p>}
    </div>
  )
}

function CheckIn({ journal, commit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => ({
    food: '', amount: '', unit: 'g', at: nowLocalInput(), pain: '', bloating: '', stool: '', notes: '', preparation: '',
  }))
  const [msg, setMsg] = useState('')
  function set(key, value) { setForm(f => ({ ...f, [key]: value })) }
  function save() {
    const result = addCheckIn(journal, {
      food: form.food,
      amount: form.amount,
      unit: form.unit,
      at: form.at,
      localDate: localDateOfInput(form.at),
      preparation: form.preparation,
      pain: form.pain || null,
      bloating: form.bloating || null,
      stool: form.stool || null,
      notes: form.notes,
    })
    if (!result.ok) { setMsg(result.reason); return }
    setMsg('')
    commit(result.state)
    setForm(f => ({ ...f, food: '', amount: '', notes: '', preparation: '' }))
  }
  const recent = [...journal.checkIns].reverse().slice(0, 8)
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">{t('fodmap.checkinTitle')}</h2>
      <p className="text-xs text-slate-600 leading-relaxed">{t('fodmap.checkinHint')}</p>
      <label className="block text-xs text-slate-600">{t('fodmap.food')}
        <input className="input mt-1" value={form.food} onChange={e => set('food', e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs text-slate-600">{t('fodmap.amount')}
          <input className="input mt-1" inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </label>
        <label className="block text-xs text-slate-600">{t('fodmap.unit')}
          <select className="input mt-1" value={form.unit} onChange={e => set('unit', e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-xs text-slate-600">{t('fodmap.preparation')}
        <input className="input mt-1" value={form.preparation} onChange={e => set('preparation', e.target.value)} />
      </label>
      <label className="block text-xs text-slate-600">{t('fodmap.when')}
        <input type="datetime-local" className="input mt-1" value={form.at} onChange={e => set('at', e.target.value)} />
      </label>
      <Scale label={t('fodmap.pain')} value={form.pain} onChange={v => set('pain', v)} />
      <Scale label={t('fodmap.bloating')} value={form.bloating} onChange={v => set('bloating', v)} />
      <label className="block text-xs text-slate-600">{t('fodmap.stool')}
        <select className="input mt-1" value={form.stool} onChange={e => set('stool', e.target.value)}>
          <option value="">{t('fodmap.stoolSkip')}</option>
          {STOOL.map(s => <option key={s} value={s}>{t(`fodmap.stool.${s}`)}</option>)}
        </select>
      </label>
      <label className="block text-xs text-slate-600">{t('fodmap.notes')}
        <textarea className="input mt-1" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </label>
      {msg && <p className="text-xs text-danger-700" role="alert">{t(`fodmap.err.${msg}`, { defaultValue: t('fodmap.err.save') })}</p>}
      <button type="button" className="btn-primary w-full" onClick={save}>{t('fodmap.saveCheckin')}</button>
      <h3 className="text-xs font-semibold text-slate-700">{t('fodmap.recent')}</h3>
      {recent.length === 0 && <p className="text-xs text-slate-500">{t('fodmap.emptyLog')}</p>}
      <ul className="space-y-2">
        {recent.map(item => (
          <li key={item.id} className="text-sm border border-slate-200 rounded-control px-3 py-2">
            <p className="font-medium text-slate-800">{item.food}</p>
            <p className="text-xs text-slate-500">{item.localDate} · {t(`fodmap.phase.${item.phase}`)}{item.amount ? ` · ${item.amount} ${item.unit}` : ''}</p>
            <button type="button" className="text-xs text-danger-700 underline mt-1" onClick={() => commit(deleteCheckIn(journal, item.id))}>{t('fodmap.delete')}</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Scale({ label, value, onChange }) {
  const { t } = useTranslation()
  return (
    <fieldset>
      <legend className="text-xs text-slate-600 mb-1">{label}</legend>
      <div className="grid grid-cols-4 gap-1">
        {LEVELS.map(level => (
          <button
            key={level}
            type="button"
            aria-pressed={value === level}
            className={`tap-target min-h-[44px] rounded-control border text-xs ${value === level ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-600'}`}
            onClick={() => onChange(value === level ? '' : level)}
          >
            {t(`fodmap.level.${level}`)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Tolerances({ journal, commit }) {
  const { t } = useTranslation()
  const blank = { foodLabel: '', ingredientId: '', preparation: '', amount: '', unit: 'g', outcome: 'tolerated', notes: '' }
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')
  function set(key, value) { setForm(f => ({ ...f, [key]: value })) }
  function save() {
    const input = { ...form, amount: form.amount === '' ? '' : Number(form.amount), at: new Date().toISOString() }
    const result = editing
      ? updateTolerance(journal, editing, input)
      : addTolerance(journal, input)
    if (!result.ok) { setMsg(result.reason); return }
    setMsg('')
    setEditing(null)
    setForm(blank)
    commit(result.state)
  }
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">{t('fodmap.tolerancesTitle')}</h2>
      <p className="text-xs text-slate-600 leading-relaxed">{t('fodmap.tolerancesHint')}</p>
      <label className="block text-xs text-slate-600">{t('fodmap.foodName')}
        <input className="input mt-1" value={form.foodLabel} onChange={e => set('foodLabel', e.target.value)} />
      </label>
      <label className="block text-xs text-slate-600">{t('fodmap.ingredientId')}
        <input className="input mt-1" value={form.ingredientId} onChange={e => set('ingredientId', e.target.value)} spellCheck={false} />
      </label>
      <label className="block text-xs text-slate-600">{t('fodmap.preparation')}
        <input className="input mt-1" value={form.preparation} onChange={e => set('preparation', e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs text-slate-600">{t('fodmap.amount')}
          <input className="input mt-1" inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </label>
        <label className="block text-xs text-slate-600">{t('fodmap.unit')}
          <select className="input mt-1" value={form.unit} onChange={e => set('unit', e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-xs text-slate-600">{t('fodmap.outcome')}
        <select className="input mt-1" value={form.outcome} onChange={e => set('outcome', e.target.value)}>
          {['tolerated', 'unclear', 'limit'].map(o => <option key={o} value={o}>{t(`fodmap.outcome.${o}`)}</option>)}
        </select>
      </label>
      {msg && <p className="text-xs text-danger-700" role="alert">{t(`fodmap.err.${msg}`, { defaultValue: t('fodmap.err.save') })}</p>}
      <button type="button" className="btn-primary w-full" onClick={save}>{editing ? t('fodmap.edit') : t('fodmap.addNote')}</button>
      {journal.undo && (
        <button type="button" className="btn-secondary w-full" onClick={() => { const r = undoToleranceChange(journal); if (r.ok) commit(r.state) }}>
          {t('fodmap.undo')}
        </button>
      )}
      {journal.tolerances.length === 0 && <p className="text-xs text-slate-500">{t('fodmap.noNotes')}</p>}
      <ul className="space-y-2">
        {journal.tolerances.map(note => (
          <li key={note.id} className="text-sm border border-slate-200 rounded-control px-3 py-2">
            <p className="font-medium text-slate-800">{note.foodLabel}</p>
            <p className="text-xs text-slate-500">{note.ingredientId} · {note.preparation} · {note.amount} {note.unit} · {t(`fodmap.outcome.${note.outcome}`)}</p>
            <p className="text-xs text-slate-500">{t('fodmap.manual')}</p>
            <div className="flex gap-3 mt-1">
              <button type="button" className="text-xs underline" onClick={() => { setEditing(note.id); setForm({ ...note, amount: String(note.amount) }) }}>{t('fodmap.edit')}</button>
              <button type="button" className="text-xs text-danger-700 underline" onClick={() => { const r = deleteTolerance(journal, note.id); if (r.ok) commit(r.state) }}>{t('fodmap.delete')}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Reintro({ journal, gate, commit }) {
  const { t } = useTranslation()
  const [foodLabel, setFood] = useState('')
  const [preparation, setPrep] = useState('')
  const [doses, setDoses] = useState([{ day: 1, amountText: '', unit: '' }, { day: 2, amountText: '', unit: '' }, { day: 3, amountText: '', unit: '' }])
  const [msg, setMsg] = useState('')
  function save() {
    const result = addChallenge(journal, { foodLabel, preparation, doses })
    if (!result.ok) { setMsg(result.reason); return }
    setMsg('')
    setFood('')
    setPrep('')
    commit(result.state)
  }
  return (
    <section className="card p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">{t('fodmap.reintroTitle')}</h2>
      <p className="text-sm text-slate-700 leading-relaxed">{t('fodmap.reintroBody')}</p>
      <p className="text-xs text-slate-500">{t('fodmap.noProtocol')} <Source id="monash-reintro" /> <Source id="monash-diary" /></p>
      {journal.phase === 'reintroduction' && (
        <>
          <label className="block text-xs text-slate-600">{t('fodmap.challengeFood')}
            <input className="input mt-1" value={foodLabel} onChange={e => setFood(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-600">{t('fodmap.preparation')}
            <input className="input mt-1" value={preparation} onChange={e => setPrep(e.target.value)} />
          </label>
          {doses.map((dose, i) => (
            <label key={dose.day} className="block text-xs text-slate-600">
              {t('fodmap.dayAmount', { day: dose.day })}
              <input
                className="input mt-1"
                value={dose.amountText}
                placeholder={t('fodmap.manual')}
                onChange={e => setDoses(list => list.map((d, n) => n === i ? { ...d, amountText: e.target.value } : d))}
              />
            </label>
          ))}
          {msg && <p className="text-xs text-danger-700" role="alert">{t(`fodmap.err.${msg}`, { defaultValue: t('fodmap.err.save') })}</p>}
          <button type="button" className="btn-primary w-full" disabled={!gate.ok} onClick={save}>{t('fodmap.startChallenge')}</button>
        </>
      )}
      <ul className="space-y-3">
        {journal.challenges.map(ch => (
          <li key={ch.id} className="border border-slate-200 rounded-control px-3 py-2 space-y-2">
            <p className="text-sm font-medium text-slate-800">{ch.foodLabel}</p>
            <p className="text-xs text-slate-500">{ch.preparation} · {t('fodmap.manual')} · {ch.status}</p>
            {ch.doses.map(d => (
              <p key={d.day} className="text-xs text-slate-600">{t('fodmap.dayAmount', { day: d.day })}: {d.amountText || '—'}</p>
            ))}
            {ch.status === 'active' && (
              <>
                <button type="button" className="btn-secondary w-full" onClick={() => { const r = stopChallenge(journal, ch.id); if (r.ok) commit(r.state) }}>{t('fodmap.stopChallenge')}</button>
                <div className="grid gap-2">
                  {['tolerated', 'unclear', 'limit'].map(outcome => (
                    <button key={outcome} type="button" className="btn-secondary w-full" onClick={() => { const r = recordChallengeOutcome(journal, ch.id, outcome); if (r.ok) commit(r.state) }}>
                      {t(`fodmap.outcome.${outcome}`)}
                    </button>
                  ))}
                </div>
              </>
            )}
            {ch.userOutcome && <p className="text-xs text-slate-600">{t(`fodmap.outcome.${ch.userOutcome}`)}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function FileCheck() {
  const { t } = useTranslation()
  const [result, setResult] = useState(null)
  async function onFile(file) {
    if (!file) return
    let json
    try { json = JSON.parse(await file.text()) } catch {
      setResult({ acceptedForPlanning: false, structurallyValid: false, errors: [{ path: '', message: t('fodmap.err.file') }] })
      return
    }
    setResult(considerDatasetForPlanning(json))
  }
  return (
    <details className="card p-5">
      <summary className="text-sm font-semibold text-slate-900 cursor-pointer">{t('fodmap.fileTitle')}</summary>
      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{t('fodmap.fileHint')}</p>
      <input className="mt-3 text-sm" type="file" accept="application/json,.json" onChange={e => onFile(e.target.files?.[0])} />
      {result && (
        <div className="mt-3 text-xs text-slate-700 space-y-1" role="status">
          <p>{result.structurallyValid ? t('fodmap.fileShapeOnly') : t('fodmap.fileRejected')}</p>
          {(result.errors || []).slice(0, 6).map((err, i) => (
            <p key={i}>{err.path ? `${err.path}: ` : ''}{err.message}</p>
          ))}
        </div>
      )}
    </details>
  )
}

function DataControls({ journal, commit, pending, setPending }) {
  const { t } = useTranslation()
  return (
    <section className="card p-5 space-y-3">
      <button type="button" className="btn-secondary w-full" onClick={() => setPending('reset')}>{t('fodmap.reset')}</button>
      <p className="text-xs text-slate-500">{t('fodmap.resetHint')}</p>
      <button type="button" className="btn-secondary w-full" onClick={() => setPending('delete')}>{t('fodmap.deleteAll')}</button>
      <p className="text-xs text-slate-500">{t('fodmap.deleteHint')}</p>
      {pending && (
        <div className="border border-slate-200 rounded-control p-3 space-y-2">
          <p className="text-sm text-slate-800">{pending === 'reset' ? t('fodmap.confirmReset') : t('fodmap.confirmDelete')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={async () => {
                if (pending === 'reset') await commit(resetJourney(journal))
                else {
                  await clearJournal()
                  await commit(emptyJournal())
                }
                setPending(null)
              }}
            >
              {pending === 'reset' ? t('fodmap.reset') : t('fodmap.deleteAll')}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={() => setPending(null)}>{t('fodmap.cancel')}</button>
          </div>
        </div>
      )}
      <SourceList />
    </section>
  )
}

function SourceList() {
  const { t } = useTranslation()
  return (
    <div className="text-xs text-slate-500 space-y-1">
      <p className="font-medium text-slate-600">{t('fodmap.sources')}</p>
      {FODMAP_SOURCES.map(source => (
        <p key={source.id}><Source id={source.id} /></p>
      ))}
    </div>
  )
}

function Source({ id }) {
  const source = FODMAP_SOURCES.find(s => s.id === id)
  if (!source) return null
  return <a className="underline" href={source.url} target="_blank" rel="noreferrer">{source.url.replace(/^https:\/\//, '')}</a>
}

