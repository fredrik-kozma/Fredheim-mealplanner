import { useState, useEffect } from 'react'

/**
 * A number input that the user can fully erase and type fresh into.
 *
 * The standard `<input type="number" value={n} onChange={e => setN(parseInt(e.target.value) || 1)} />`
 * pattern is hostile: the moment the user clears the field, parseInt
 * returns NaN, the `|| 1` snaps it back to 1, and the user can never
 * type a multi-digit replacement without first deleting the leading "1".
 *
 * This component keeps a *local string* while the input is focused so
 * "" is a valid in-progress state. It commits to the parent state on
 * blur or Enter, clamping to [min, max].
 *
 * Props:
 *   - value:    number — the canonical value held by the parent
 *   - onChange: (newValue: number) => void
 *   - min:      number (default 1)
 *   - max:      number (default 9999)
 *   - className: extra classes for the <input>
 */
export default function EditableNumber({
  value,
  onChange,
  min = 1,
  max = 9999,
  className = '',
  ...inputProps
}) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)

  // Mirror prop changes back to the draft when not focused (e.g. when
  // the +/- buttons bumped the value from outside).
  useEffect(() => {
    if (!focused) setDraft(String(value))
  }, [value, focused])

  function commit() {
    const parsed = parseInt(draft, 10)
    if (isNaN(parsed)) {
      // User left the field empty or non-numeric — revert to current value.
      setDraft(String(value))
      return
    }
    const clamped = Math.max(min, Math.min(max, parsed))
    setDraft(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft}
      onChange={(e) => {
        // Strip everything that isn't a digit, but allow the empty
        // string so the user can erase the whole field.
        const cleaned = e.target.value.replace(/[^\d]/g, '')
        setDraft(cleaned)
      }}
      onFocus={(e) => {
        setFocused(true)
        // Select on focus so a single keystroke replaces the value.
        e.target.select()
      }}
      onBlur={() => {
        setFocused(false)
        commit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      className={className}
      {...inputProps}
    />
  )
}
