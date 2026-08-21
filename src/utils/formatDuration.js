/**
 * Formats a duration in minutes for display.
 *
 * Recipe times in this collection span three orders of magnitude — a
 * 5-minute sauce, a 16-hour yogurt ferment, a 5-day sourdough starter —
 * so a bare minute count stops being readable well before the top of
 * that range. The starter's 7200 minutes rendered literally as
 * "7200 min" on the detail page and "7200m" on printouts.
 *
 *   45   -> "45m"
 *   85   -> "1h 25m"
 *   960  -> "16h"
 *   2620 -> "43h 40m"
 *   7200 -> "5d"
 *
 * Days only kick in past two full days: a bread that proves for 38 hours
 * is easier to plan around as "38h" than as "1d 14h", but "5d" is
 * clearer than "120h".
 *
 * Returns '' for null/0/negative/non-numeric, so callers can treat an
 * absent time as an empty string rather than special-casing it.
 */
export function formatDuration(minutes) {
  const total = Math.round(Number(minutes))
  if (!Number.isFinite(total) || total <= 0) return ''

  if (total < 60) return `${total}m`

  const hours = Math.floor(total / 60)
  const mins = total % 60

  if (hours < 48) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const days = Math.floor(hours / 24)
  const remHours = hours % 24
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`
}
