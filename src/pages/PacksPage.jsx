import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../store/useStore'
import { BUILT_IN_REGISTRY, BUILT_IN_PACKS } from '../data/installedPacks'
import { fetchRegistry, fetchPack } from '../utils/recipePacks'
import ExportPackModal from '../components/packs/ExportPackModal'

// ── Toast notification ─────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-control shadow-overlay">
      <svg className="w-4 h-4 text-success-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
      {message}
    </div>
  )
}

// ── Pack card ──────────────────────────────────────────────────────────────

function PackCard({ pack, onInstall, installing }) {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const installedPacks = useStore(s => s.installedPacks)
  const isInstalled = Boolean(installedPacks[pack.id])
  const installedVersion = installedPacks[pack.id]?.version ?? null
  const hasUpdate = isInstalled && installedVersion !== pack.version

  // Use translated name/description if available, otherwise fall back to English
  const displayName = pack.translations?.[currentLang]?.name || pack.name
  const displayDescription = pack.translations?.[currentLang]?.description || pack.description

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="section-title">{displayName}</h3>
            <span className="badge bg-slate-100 text-slate-500 text-xs">v{pack.version}</span>
          </div>
          <p className="text-xs text-slate-500">{t('packs.by')} {pack.author}</p>
        </div>

        {/* Action button */}
        {isInstalled && !hasUpdate ? (
          <span className="badge bg-slate-100 text-slate-500 flex-shrink-0 py-1.5 px-3">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {t('packs.installed')}
          </span>
        ) : hasUpdate ? (
          <button
            onClick={() => onInstall(pack)}
            disabled={installing}
            className="btn-primary btn-sm flex-shrink-0"
          >
            {installing ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
            {t('packs.update')}
          </button>
        ) : (
          <button
            onClick={() => onInstall(pack)}
            disabled={installing}
            className="btn-primary btn-sm flex-shrink-0"
          >
            {installing ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            {t('packs.install')}
          </button>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{displayDescription}</p>

      {/* Tags */}
      {pack.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pack.tags.map(tag => (
            <span key={tag} className="badge bg-primary-50 text-primary-600 text-xs">{tag}</span>
          ))}
        </div>
      )}

      {/* Recipe count + preview */}
      <div className="border-t border-slate-100 pt-3 mt-1">
        <p className="text-xs font-medium text-slate-500 mb-1.5">
          {t('packs.recipesIncluded', { count: pack.recipeCount ?? pack.recipes?.length ?? 0 })}
        </p>
        {pack.recipes && (
          <p className="text-xs text-slate-400 leading-relaxed">
            {pack.recipes.slice(0, 5).map(r => r.title).join(' · ')}
            {pack.recipes.length > 5 && ` · +${pack.recipes.length - 5} more`}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function PacksPage() {
  const { t } = useTranslation()
  const installPack = useStore(s => s.installPack)

  const [installingId, setInstallingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)

  const [onlineRegistry, setOnlineRegistry] = useState([])
  const [onlinePacks, setOnlinePacks] = useState({})
  const [loadingRegistry, setLoadingRegistry] = useState(false)
  const [registryError, setRegistryError] = useState(null)

  const loadRegistry = useCallback(async () => {
    setLoadingRegistry(true)
    setRegistryError(null)
    try {
      const data = await fetchRegistry()
      const builtInIds = new Set(BUILT_IN_REGISTRY.map(p => p.id))
      setOnlineRegistry(data.filter(p => !builtInIds.has(p.id)))
    } catch {
      setRegistryError(t('packs.loadError'))
    } finally {
      setLoadingRegistry(false)
    }
  }, [t])

  useEffect(() => {
    loadRegistry()
  }, [loadRegistry])

  async function handleInstallBuiltIn(packMeta) {
    const fullPack = BUILT_IN_PACKS[packMeta.id]
    if (!fullPack) return
    setInstallingId(packMeta.id)
    await new Promise(r => setTimeout(r, 300))
    installPack(fullPack)
    setInstallingId(null)
    setToast(t('packs.installSuccess', { name: fullPack.name, count: fullPack.recipes.length }))
  }

  async function handleInstallOnline(packMeta) {
    setInstallingId(packMeta.id)
    try {
      let fullPack = onlinePacks[packMeta.id]
      if (!fullPack) {
        fullPack = await fetchPack(packMeta.id)
        setOnlinePacks(prev => ({ ...prev, [packMeta.id]: fullPack }))
      }
      installPack(fullPack)
      setToast(t('packs.installSuccess', { name: fullPack.name, count: fullPack.recipes.length }))
    } catch {
      setToast(t('packs.downloadError'))
    } finally {
      setInstallingId(null)
    }
  }

  return (
    <div className="pb-nav lg:pb-8">
      {/* Page header */}
      <PageHeader
        title={t('packs.title')}
        subtitle={t('packs.subtitle')}
        actions={
          <button
            onClick={() => setShowExportModal(true)}
            aria-label={t('packs.createPack')}
            className="btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span className="hidden sm:inline">{t('packs.createPack')}</span>
          </button>
        }
      />

      <div className="px-4 space-y-8">

        {/* ── Built-in packs ─────────────────────────────────────────────── */}
        <section>
          <h2 className="eyebrow mb-3">
            {t('packs.builtIn')}
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {t('packs.builtInDesc')}
          </p>
          <div className="space-y-4">
            {BUILT_IN_REGISTRY.map(packMeta => (
              <PackCard
                key={packMeta.id}
                pack={{ ...packMeta, ...BUILT_IN_PACKS[packMeta.id] }}
                onInstall={handleInstallBuiltIn}
                installing={installingId === packMeta.id}
              />
            ))}
          </div>
        </section>

        {/* ── Online packs ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="eyebrow">
              {t('packs.online')}
            </h2>
            <button
              onClick={loadRegistry}
              disabled={loadingRegistry}
              className="btn-secondary btn-sm"
            >
              <svg
                className={`w-3.5 h-3.5 ${loadingRegistry ? 'animate-spin' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              {t('packs.refresh')}
            </button>
          </div>

          {loadingRegistry && (
            <div className="card p-8 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-6 h-6 animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm">{t('packs.fetchingRegistry')}</p>
            </div>
          )}

          {!loadingRegistry && registryError && (
            <div className="card p-5 border-danger-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-slate-700">{t('packs.loadError')}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{registryError}</p>
                </div>
              </div>
            </div>
          )}

          {!loadingRegistry && !registryError && onlineRegistry.length === 0 && (
            <EmptyState
              className="card"
              icon="📦"
              title={t('packs.noOnlinePacks')}
              body={t('packs.noOnlinePacksDesc')}
            />
          )}

          {!loadingRegistry && !registryError && onlineRegistry.length > 0 && (
            <div className="space-y-4">
              {onlineRegistry.map(packMeta => (
                <PackCard
                  key={packMeta.id}
                  pack={packMeta}
                  onInstall={handleInstallOnline}
                  installing={installingId === packMeta.id}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {showExportModal && <ExportPackModal onClose={() => setShowExportModal(false)} />}
    </div>
  )
}
