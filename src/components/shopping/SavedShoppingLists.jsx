import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

export default function SavedShoppingLists({ onClose }) {
  const { t } = useTranslation()
  const savedShoppingLists = useStore(s => s.savedShoppingLists)
  const deleteSavedShoppingList = useStore(s => s.deleteSavedShoppingList)

  function handleDelete(list) {
    if (confirm(t('shopping.deleteListConfirm', { name: list.name }))) {
      deleteSavedShoppingList(list.id)
    }
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function countItems(items) {
    if (!items) return 0
    return items.reduce((sum, g) => sum + (g.items?.length || 0), 0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{t('shopping.savedListsTitle')}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5">
          {savedShoppingLists.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-sm text-slate-500">{t('shopping.noSavedLists')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...savedShoppingLists].reverse().map(list => (
                <div key={list.id} className="card p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{list.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('shopping.itemCount', { count: countItems(list.items) })} ·{' '}
                      {formatDate(list.savedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(list)}
                    className="btn-ghost p-1.5 text-slate-300 hover:text-red-500 flex-shrink-0"
                    title={t('common.delete')}
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
      </div>
    </div>
  )
}
