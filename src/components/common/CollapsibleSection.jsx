/**
 * A card that opens on tap, closed to start with, showing one line of summary
 * while closed. Native <details>, so the keyboard and screen readers work
 * without any script, and its contents keep their state when closed.
 */
export default function CollapsibleSection({ icon, title, summary, children }) {
  return (
    <details className="card group">
      <summary className="flex items-center gap-3 min-h-[3.25rem] px-4 py-2.5 rounded-card cursor-pointer list-none select-none hover:bg-slate-50/80 transition-colors focus-visible:-outline-offset-2 [&::-webkit-details-marker]:hidden">
        {icon && <span className="flex-shrink-0 text-lg" aria-hidden>{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-800">{title}</span>
          {summary && <span className="block truncate text-xs text-slate-500 tabular-nums">{summary}</span>}
        </span>
        <svg className="w-4 h-4 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  )
}
