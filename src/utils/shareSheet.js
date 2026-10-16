/**
 * One call that gets content out of the app and into whatever the person
 * actually uses — WhatsApp, Messages, Mail, AirDrop.
 *
 * navigator.share opens the operating system's own share sheet. That is
 * the whole reason this is simple: we don't integrate with any service,
 * the phone already has them all. It exists on iOS Safari and Android
 * Chrome, which is where this app lives as an installed PWA.
 *
 * Desktop browsers are patchier, so every path falls back to the
 * clipboard and reports which thing happened. The caller tells the user —
 * silently copying when they expected a share sheet looks like the
 * button did nothing.
 *
 * Two rules the Web Share API enforces, both of which have bitten this
 * kind of code before:
 *   - it must be called from a real user gesture, so no awaiting slow
 *     work before it. Callers prepare the payload first, then share.
 *   - a cancelled sheet rejects with AbortError. That is a person
 *     choosing not to send, not a failure, and must not raise an error.
 */

const isAbort = (err) => err && (err.name === 'AbortError' || err.code === 20)

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older Safari and any non-secure context land here.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

/**
 * @returns 'shared' | 'copied' | 'cancelled' | 'failed'
 */
export async function shareTextOrCopy({ title, text }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (err) {
      if (isAbort(err)) return 'cancelled'
      // Fall through: some browsers advertise share and then refuse.
    }
  }
  return (await copy(text)) ? 'copied' : 'failed'
}

/**
 * Sharing a file — used for a recipe whose photo can't ride in a link.
 * canShare({files}) is a separate check from share() existing, and gets
 * it wrong often enough that the download fallback has to stay.
 */
export async function shareFileOrDownload({ title, text, file, filename }) {
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title, text, files: [file] })
      return 'shared'
    } catch (err) {
      if (isAbort(err)) return 'cancelled'
    }
  }
  try {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return 'downloaded'
  } catch {
    return 'failed'
  }
}

export const canUseShareSheet = () => Boolean(navigator.share)
