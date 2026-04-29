import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './Icon'

/**
 * Tooltip acessível custom. Pattern do UserMenu:
 * - hover (desktop) / tap (mobile) / focus (teclado) abre
 * - ESC fecha; click outside fecha
 * - aria-describedby aponta do trigger para o id do tooltip
 * - auto-flip: se não couber acima, abre abaixo
 */
export function Tooltip({ text, children, side = 'top' }) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState(side)
  const wrapRef = useRef(null)
  const tipRef = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open || !tipRef.current || !wrapRef.current) return
    const tipRect = tipRef.current.getBoundingClientRect()
    const wrapRect = wrapRef.current.getBoundingClientRect()
    if (wrapRect.top - tipRect.height < 8) setPlacement('bottom')
    else setPlacement('top')
  }, [open])

  const trigger = children ?? (
    <button
      type="button"
      aria-label="Ver explicação"
      className="inline-flex items-center justify-center text-fg-subtle hover:text-fg-muted focus:text-fg-muted transition-colors"
    >
      <Icon name="info" className="w-3.5 h-3.5" />
    </button>
  )

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) } }}
        className="inline-flex"
      >
        {trigger}
      </span>
      {open && (
        <span
          ref={tipRef}
          id={id}
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 z-50 max-w-xs w-max px-3 py-2 rounded-lg text-[12px] leading-relaxed shadow-soft border border-line ${placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
          style={{ background: 'rgb(var(--surface))', color: 'rgb(var(--fg))' }}
        >
          {text}
        </span>
      )}
    </span>
  )
}
