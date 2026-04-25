import { useEffect } from 'react'
import { Icon } from './Icon'

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 anim-fade">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} bg-surface rounded-t-2xl sm:rounded-2xl shadow-pop anim-scale max-h-[92vh] flex flex-col border border-line`}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line">
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Fechar">
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-line flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
