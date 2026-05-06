import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

export default function PlannerTemplates({ onClose }) {
  const { t } = useTranslation()
  const plannerTemplates = useStore(s => s.plannerTemplates)
  const savePlannerTemplate = useStore(s => s.savePlannerTemplate)
  const loadPlannerTemplate = useStore(s => s.loadPlannerTemplate)
  const deletePlannerTemplate = useStore(s => s.deletePlannerTemplate)
  const weekPlan = useStore(s => s.weekPlan)

  const [mode, setMode] = useState('list') // 'list' | 'save'
  const [templateName, setTemplateName] = useState('')
  const [toast, setToast] = useState(null)

  // Count meals in current week plan
  const currentMealCount = Object.values(weekPlan).reduce((sum, day) =>
    sum + Object.values(day).reduce((s2, ids) => s2 + ids.length, 0), 0
  )

  function handleSave() {
    const name = templateName.trim()
    if (!name) return
    savePlannerTemplate(name)
    setTemplateName('')
    setMode('list')
    setToast(t('planner.templateSaved'))
    setTimeout(() => setToast(null), 3000)
  }

  function handleLoad(tmpl) {
    if (confirm(t('planner.loadConfirm', { name: tmpl.name }))) {
      loadPlannerTemplate(tmpl.id)
      onClose()
    }
  }

  function handleDelete(tmpl) {
    if (confirm(t('planner.deleteConfirm', { name: tmpl.name }))) {
      deletePlannerTemplate(tmpl.id)
    }
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {mode === 'save' ? t('planner.saveAsTemplate') : t('planner.loadTemplates')}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setMode('list')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('planner.loadTemplate')}
          </button>
          <button
            onClick={() => setMode('save')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === 'save' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('planner.saveAsTemplate')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'save' ? (
            <div className="space-y-4">
              <div>
                <label className="label">{t('planner.templateName')}</label>
                <input
                  className="input"
                  placeholder={t('planner.templateNamePlaceholder')}
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500">
                {t('planner.mealsPlanned', { count: currentMealCount })}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setMode('list')} className="btn-secondary flex-1">
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!templateName.trim()}
                  className="btn-primary flex-1"
                >
                  {t('planner.saveTemplate')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {plannerTemplates.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-sm text-slate-500">{t('planner.noTemplates')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...plannerTemplates].reverse().map(tmpl => (
                    <div key={tmpl.id} className="card p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{tmpl.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('planner.mealsPlanned', { count: tmpl.mealCount })} ·{' '}
                          {t('planner.savedAt', { date: formatDate(tmpl.savedAt) })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLoad(tmpl)}
                        className="btn-primary py-1.5 px-3 text-xs flex-shrink-0"
                      >
                        {t('planner.load')}
                      </button>
                      <button
                        onClick={() => handleDelete(tmpl)}
                        className="btn-ghost p-1.5 text-slate-300 hover:text-red-500 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  )
}
