import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import LegalShell, { linkify } from '../components/legal/LegalShell'
import { initialLegalLang, legalText, privacyCopy } from '../content/legalCopy'

export default function PrivacyPage() {
  const location = useLocation()
  const [lang, setLang] = useState(() => initialLegalLang(location.search, location.state?.lang))
  const copy = legalText(privacyCopy, lang)

  return (
    <LegalShell
      lang={lang}
      setLang={setLang}
      title={copy.title}
      footer={(
        <p>
          <Link to="/delete-account" state={{ lang }} className="text-link">
            {lang === 'no' ? 'Slett konto' : lang === 'sv' ? 'Radera konto' : 'Delete account'}
          </Link>
        </p>
      )}
    >
      <h1 className="page-title">{copy.title}</h1>
      <p className="text-xs text-slate-400 mt-1">{copy.updated}</p>
      <p className="text-sm text-slate-600 mt-4 leading-relaxed">{linkify(copy.intro)}</p>
      <div className="mt-6 space-y-6">
        {copy.sections.map(section => (
          <section key={section.title}>
            <h2 className="section-title">{section.title}</h2>
            <div className="mt-2 space-y-2">
              {section.paragraphs.map(paragraph => (
                <p key={paragraph} className="text-sm text-slate-600 leading-relaxed">
                  {linkify(paragraph)}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </LegalShell>
  )
}
