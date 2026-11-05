import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL_LANGS, SELLER } from '../../content/legalCopy'

const LINK_RE = /(https:\/\/fredheim-meal\.netlify\.app(?:\/[a-z0-9-]*)?|viverahealth@gmail\.com)/g

export function linkify(text) {
  const parts = String(text).split(LINK_RE)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('https://')) {
      return <a key={i} href={part} className="text-link break-all">{part}</a>
    }
    if (part.includes('@')) {
      return <a key={i} href={`mailto:${part}`} className="text-link">{part}</a>
    }
    return <span key={i}>{part}</span>
  })
}

export default function LegalShell({ lang, setLang, title, children, footer }) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} — ${SELLER.app}`
    return () => { document.title = previous }
  }, [title])

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="bg-white border-b border-slate-200/70">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src="/fredheim-logo.svg" alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
            <span className="section-title truncate">{SELLER.app}</span>
          </Link>
          <div className="flex gap-1 flex-shrink-0" role="group" aria-label="Language">
            {LEGAL_LANGS.map(({ code, label, short }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                aria-label={label}
                className={`tap-target min-h-[2.25rem] px-2.5 rounded-small text-xs font-semibold transition-colors ${
                  lang === code
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {short}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-16">
        {children}
        <footer className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
          <p>{SELLER.name}</p>
          <p>{SELLER.address}</p>
          <p><a className="text-link" href={`mailto:${SELLER.email}`}>{SELLER.email}</a></p>
          {footer}
        </footer>
      </main>
    </div>
  )
}
