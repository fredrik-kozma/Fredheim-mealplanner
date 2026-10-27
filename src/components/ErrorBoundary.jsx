import React from 'react'
import { buildBackup, downloadBackup, readPersistedState } from '../utils/dataBackup'

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
 * phone user has no other way out of that loop.
 *
 * It is also the most destructive button in the app: the built-in
 * recipes come back from the bundle, but the user's own recipes, weeks
 * and logs are gone for good. So the wording says that plainly, and the
 * export sits next to it — someone reaching this screen is exactly the
 * person who never made a backup.
 *
 * That export reads IndexedDB directly rather than going through the
 * store, for the same reason the reset does: on this screen the store
 * may be precisely what is broken.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, exportState: null }
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
  handleExport = async () => {
    this.setState({ exportState: 'working' })
    try {
      const state = await readPersistedState()
      if (!state) { this.setState({ exportState: 'empty' }); return }
      downloadBackup(buildBackup(state))
      this.setState({ exportState: 'done' })
    } catch (err) {
      console.error('Could not export data', err)
      this.setState({ exportState: 'failed' })
    }
  }

  handleReset = () => {
    const warning =
      'Delete everything saved in this browser?\n\n' +
      'The built-in recipes will come back automatically. Your own recipes, ' +
      'your week plans, saved weeks, shopping lists and nutrition log will be ' +
      'deleted permanently and cannot be recovered.\n\n' +
      'Use "Export my data first" if you have not saved a copy.'
    if (!confirm(warning)) return
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
          <button
            onClick={this.handleExport}
            disabled={this.state.exportState === 'working'}
            className="btn-secondary disabled:opacity-50"
          >
            {this.state.exportState === 'working' ? 'Saving…' : 'Export my data first'}
          </button>
          <button onClick={this.handleReset} className="btn-ghost text-slate-500">
            Reset app data
          </button>
        </div>

        {this.state.exportState === 'done' && (
          <p className="text-xs text-green-700 mt-3">
            Saved. Keep that file somewhere safe — Settings → Your data brings it back.
          </p>
        )}
        {this.state.exportState === 'empty' && (
          <p className="text-xs text-slate-500 mt-3">
            There was no saved data to export.
          </p>
        )}
        {this.state.exportState === 'failed' && (
          <p className="text-xs text-red-600 mt-3">
            Could not read the saved data to export it.
          </p>
        )}

        <p className="text-xs text-slate-400 mt-4">
          Resetting brings the built-in recipes back, but permanently deletes your
          own recipes, week plans and logs.
        </p>
      </div>
    )
  }
}
