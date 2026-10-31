/** What a page or panel shows when it has nothing in it yet. */
export default function EmptyState({ icon, title, body, children, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div className="empty-state-icon" aria-hidden>{icon}</div>}
      {title && <h2 className="empty-state-title">{title}</h2>}
      {body && <p className="empty-state-body">{body}</p>}
      {children && <div className="empty-state-actions">{children}</div>}
    </div>
  )
}
