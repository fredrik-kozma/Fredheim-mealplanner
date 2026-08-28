import React from 'react'

/**
 * Catches render errors so a crash shows something readable instead of a
 * blank page.
 *
 * React unmounts the whole tree when a render throws and nothing catches
 * it, leaving an empty #root — indistinguishable from the app never
 * having loaded. On a phone there is no console to check, so "it just
 * opens white" is all the user can report.
 *
 * The reset button clears the persisted store. A render error caused by
 * malformed saved data would otherwise reproduce on every launch, and a
 * phone user has no other way out of that loop. It is destructive enough
 * to sit behind a confirm, and it only removes local data — the recipe
 * packs reinstall from the bundle on next load.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // No error reporting service here, but the console still helps when a
    // device can be inspected.
    console.error('Unhandled render error', error, info)
  }

  // Raw indexedDB rather than the idb-keyval helper the store uses: an
  // error path should depend on as little as possible, and this still
  // works if that module is itself part of the problem.
  handleReset = () => {
    if (!confirm('Reset the app and delete locally saved data? Your recipes will be reinstalled.')) return
    try {
      const req = indexedDB.deleteDatabase('menu-planner-db')
      req.onsuccess = req.onerror = req.onblocked = () => location.reload()
      // Don't hang forever if the delete never settles.
      setTimeout(() => location.reload(), 3000)
    } catch (err) {
      console.error('Could not clear stored data', err)
      location.reload()
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="max-w-lg mx-auto px-5 py-10 text-slate-800">
        <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-600 mb-4">
          The app hit an error it could not recover from. Reloading fixes most cases.
        </p>
        <p className="text-xs text-slate-400 break-words mb-6">
          {String(this.state.error?.message || this.state.error)}
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => location.reload()} className="btn-primary">
            Reload
          </button>
          <button onClick={this.handleReset} className="btn-ghost text-slate-500">
            Reset app data
          </button>
        </div>
      </div>
    )
  }
}
