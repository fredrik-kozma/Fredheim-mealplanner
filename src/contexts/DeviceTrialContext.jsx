import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { isNativeAndroid } from '../utils/nativePlatform'
import { resolveDeviceTrial } from '../lib/deviceTrial'
import { getHashedAndroidId } from '../lib/deviceId'
import { readLocalFirstSeen, writeLocalFirstSeen } from '../lib/deviceTrialStorage'
import { fetchDeviceTrialStart } from '../lib/deviceTrialServer'

const IDLE = {
  applicable: false,
  grantsAccess: false,
  pending: false,
  expired: false,
  daysLeft: 0,
  firstSeen: null,
  endsAt: null,
  showBanner: false,
}

const DeviceTrialContext = createContext(IDLE)

/**
 * Android only. Starts (or reads) the 14-day device trial. On the website
 * the value stays inactive so account gating is unchanged.
 */
export function DeviceTrialProvider({ children }) {
  const applicable = isNativeAndroid()
  const [state, setState] = useState(IDLE)

  const refresh = useCallback(async () => {
    if (!applicable) return
    const local = await readLocalFirstSeen().catch(() => null)
    let server = null
    let serverUnreachable = false
    try {
      const hash = await getHashedAndroidId()
      server = await fetchDeviceTrialStart(hash)
    } catch (err) {
      serverUnreachable = true
      console.warn('[deviceTrial] server unreachable', err)
    }
    const next = resolveDeviceTrial({
      serverFirstSeen: server,
      localFirstSeen: local,
      serverUnreachable,
      now: new Date(),
    })
    setState({ applicable: true, ...next })
    if (next.firstSeen) {
      writeLocalFirstSeen(next.firstSeen).catch(() => {})
    }
  }, [applicable])

  useEffect(() => {
    if (!applicable) return undefined
    // Optimistic full access until the first answer, so a first launch
    // offline is not flashed the locked UI. An expired local copy replaces
    // this as soon as Preferences returns.
    setState({ applicable: true, ...resolveDeviceTrial({ serverUnreachable: true, now: new Date() }) })
    refresh()
    return undefined
  }, [applicable, refresh])

  useEffect(() => {
    if (!applicable || !state.pending) return undefined
    const id = setInterval(() => { refresh() }, 60000)
    function onVisible() {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [applicable, state.pending, refresh])

  return (
    <DeviceTrialContext.Provider value={applicable ? state : IDLE}>
      {children}
    </DeviceTrialContext.Provider>
  )
}

export function useDeviceTrial() {
  return useContext(DeviceTrialContext) || IDLE
}
