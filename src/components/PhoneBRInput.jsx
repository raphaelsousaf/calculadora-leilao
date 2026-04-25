import { useMemo } from 'react'

export function formatBRNational(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 11)
  if (!d) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 3) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2,3)} ${d.slice(3)}`
  return `(${d.slice(0,2)}) ${d.slice(2,3)} ${d.slice(3,7)}-${d.slice(7)}`
}

export function fullBRValue(national) {
  const d = String(national || '').replace(/\D/g, '')
  if (!d) return ''
  return `+55 ${formatBRNational(d)}`
}

function stripCountry(stored) {
  return String(stored || '').replace(/^\+?55\s*/, '')
}

export function PhoneBRInput({ value, onChange, disabled, required, placeholder = '(31) 9 0000-0000', autoComplete = 'tel-national' }) {
  const display = useMemo(() => formatBRNational(stripCountry(value)), [value])

  const handle = (e) => {
    const national = formatBRNational(e.target.value)
    onChange(national ? `+55 ${national}` : '')
  }

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted text-sm pointer-events-none select-none font-medium">
        +55
      </span>
      <input
        type="tel" inputMode="tel"
        className="input !pl-14"
        value={display}
        onChange={handle}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
      />
    </div>
  )
}
