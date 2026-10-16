import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { encodeShare, shareUrlFor } from '../../utils/shareCodec'
import { shareTextOrCopy, shareFileOrDownload, canUseShareSheet } from '../../utils/shareSheet'

/**
 * The share sheet: one button, three ways out.
 *
 * The link is built as soon as the sheet opens, not when a button is
 * pressed. Compressing is asynchronous, and Safari only honours
 * navigator.share() when it is called straight out of a tap — awaiting
 * anything first makes it refuse. So the await happens here, while the
 * person is still reading, and the handlers are ready to fire.
 *
 * Rendered through a portal for the same reason TimerPanel is: the
 * header's backdrop-blur becomes the containing block for fixed
 * positioning underneath it, which puts a fixed overlay somewhere off
 * screen instead of over the page.
 */
export default function ShareModal({ kind, payload, text, title, fileBuilder, onClose }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let alive = true
    encodeShare(payload)
      .then(code => { if (alive) setUrl(shareUrlFor(code)) })
      .catch(() => { if (alive) setUrl(null) })
    return () => { alive = false }
  }, [payload])

  function report(result) {
    if (result === 'cancelled') return
    if (result === 'shared') { onClose(); return }
    setToast(
      result === 'copied' ? t('share.copied', { defaultValue: 'Copied — paste it anywhere' })
        : result === 'downloaded' ? t('share.downloaded', { defaultValue: 'Saved to your downloads' })
          : t('share.failed', { defaultValue: "Couldn't share that" })
    )
    setTimeout(() => setToast(null), 3500)
  }

  async function sendLink() {
    if (!url || busy) return
    setBusy(true)
    report(await shareTextOrCopy({ title, text: url }))
    setBusy(false)
  }

  async function sendText() {
    if (busy) return
    setBusy(true)
    // The link rides along at the end of the message, so one send is
    // readable to anyone and importable by anyone who has the app.
    report(await shareTextOrCopy({ title, text: url ? `${text}\n\n${url}` : text }))
    setBusy(false)
  }

  async function sendFile() {
    if (busy || !fileBuilder) return
    setBusy(true)
    const built = await fileBuilder()
    report(built ? await shareFileOrDownload({ title, ...built }) : 'failed')
    setBusy(false)
  }

  const sheetVerb = canUseShareSheet()
    ? t('share.viaSheet', { defaultValue: 'Share' })
    : t('share.viaCopy', { defaultValue: 'Copy' })

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl">
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            {kind === 'week'
              ? t('share.titleWeek', { defaultValue: 'Share this menu' })
              : t('share.titleRecipe', { defaultValue: 'Share this recipe' })}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-2">
          <Option
            icon="🔗"
            disabled={!url || busy}
            onClick={sendLink}
            label={`${sheetVerb} — ${t('share.asLink', { defaultValue: 'as a link' })}`}
            hint={kind === 'week'
              ? t('share.asLinkHintWeek', { defaultValue: 'They tap it and the app offers to add the whole week' })
              : t('share.asLinkHintRecipe', { defaultValue: 'They tap it and the app opens the recipe' })}
            trailing={url ? null : <Spinner />}
          />
          <Option
            icon="📝"
            disabled={busy}
            onClick={sendText}
            label={`${sheetVerb} — ${t('share.asText', { defaultValue: 'as text' })}`}
            hint={t('share.asTextHint', { defaultValue: 'Readable by anyone, even without the app' })}
          />
          {fileBuilder && (
            <Option
              icon="📎"
              disabled={busy}
              onClick={sendFile}
              label={`${sheetVerb} — ${t('share.asFile', { defaultValue: 'as a file' })}`}
              hint={t('share.asFileHint', { defaultValue: 'Keeps the photo; they open it with Import' })}
            />
          )}
        </div>

        {toast && (
          <div className="px-5 pb-4 -mt-1">
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function Option({ icon, label, hint, onClick, disabled, trailing }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-xl leading-none mt-0.5" aria-hidden>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>
      </span>
      {trailing}
    </button>
  )
}

function Spinner() {
  return (
    <span className="w-4 h-4 mt-1 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" aria-hidden />
  )
}
