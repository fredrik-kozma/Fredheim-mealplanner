import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscription } from '../../hooks/useSubscription'
import NativePaywallModal from './NativePaywallModal'

/**
 * Quiet line for the last 3 days of the Android device trial.
 * Renders nothing on the website and nothing earlier in the trial.
 */
export default function DeviceTrialBanner() {
  const { t } = useTranslation()
  const { showDeviceTrialBanner, daysLeft } = useSubscription()
  const [open, setOpen] = useState(false)
  if (!showDeviceTrialBanner) return null

  return (
    <>
      <div className="bg-amber-50 text-amber-950 border-b border-amber-100">
        <div className="flex items-center justify-center gap-3 px-3 py-1.5 max-w-5xl mx-auto">
          <span className="text-xs">
            {t('subscription.deviceTrialBanner', { count: daysLeft })}
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="tap-target text-xs font-semibold underline underline-offset-2"
          >
            {t('subscription.nativeSubscribe')}
          </button>
        </div>
      </div>
      {open && <NativePaywallModal onClose={() => setOpen(false)} />}
    </>
  )
}
