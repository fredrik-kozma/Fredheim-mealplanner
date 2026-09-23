/**
 * The sound a finished kitchen timer makes: a soft two-tone chime that
 * repeats every few seconds until it's dismissed — loud enough to carry
 * out of the kitchen, gentle enough not to startle anyone.
 *
 * Synthesised with WebAudio rather than shipped as an audio file. The app
 * already carries a large bundle (the pack photos), and a decent-quality
 * chime sample would add a few hundred KB for two notes we can generate in
 * a few lines.
 *
 * Browsers refuse to start audio without a user gesture, so the context is
 * created lazily on the first start() — which is always reached through a
 * tap on "Start" — and resumed defensively each time, since a context can
 * be suspended again when the tab is backgrounded.
 *
 * Known limit, worth being honest about: a phone with the screen locked or
 * the app in the background may suspend audio entirely. The chime is
 * reliable while the app is open and on screen; it is not an alarm clock.
 */

let ctx = null
let loopId = null
let stopped = true

function context() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

/**
 * One "ding-dong": two descending notes, each a sine with a quick attack
 * and a long exponential tail, which is what makes it read as a chime
 * rather than a beep.
 */
function ding(startAt) {
  const c = context()
  if (!c) return
  const notes = [
    { freq: 880, at: 0, gain: 0.34 },     // A5
    { freq: 659.25, at: 0.26, gain: 0.30 }, // E5
  ]
  for (const n of notes) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = n.freq
    const t0 = startAt + n.at
    // Ramp rather than a hard start/stop — a square-edged envelope clicks.
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(n.gain, t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + 1.2)
  }
}

/** Start chiming, repeating until stopChime(). Safe to call when already ringing. */
export function startChime() {
  const c = context()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  if (!stopped) return
  stopped = false
  ding(c.currentTime + 0.02)
  loopId = setInterval(() => {
    const cc = context()
    if (!cc || stopped) return
    if (cc.state === 'suspended') cc.resume().catch(() => {})
    ding(cc.currentTime + 0.02)
  }, 3200)
}

/** Silence it. Safe to call when nothing is ringing. */
export function stopChime() {
  stopped = true
  if (loopId) {
    clearInterval(loopId)
    loopId = null
  }
}

/**
 * Open the audio device while a user gesture is still in progress.
 *
 * Call this from the tap that starts a timer. iOS will not let a context
 * created later — when the timer expires, with no gesture in sight — make
 * any sound at all, so without this the alarm is silently dead on exactly
 * the device most likely to be propped up in a kitchen.
 *
 * Deliberately inaudible: a real chime here would be the same sound as the
 * alarm, and "ding-dong" the instant you start a 20-minute rise reads as
 * "already finished". A momentary near-silent tone is enough to open the
 * device.
 */
export function unlockAudio() {
  const c = context()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  const osc = c.createOscillator()
  const gain = c.createGain()
  gain.gain.value = 0.0001
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.03)
}

/** One chime, no loop — for a "try the sound" affordance. */
export function previewChime() {
  const c = context()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  ding(c.currentTime + 0.02)
}
