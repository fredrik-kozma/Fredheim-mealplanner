/** The title row at the top of a page, with its optional main actions. */
export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`page-header ${className}`}>
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle mt-0.5 first-letter:uppercase">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
