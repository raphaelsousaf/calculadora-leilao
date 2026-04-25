import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Icon } from './Icon'
import { buildWhatsAppMessage, openWhatsApp } from '../lib/whatsapp'

export function WhatsAppModal({ open, onClose, calc, meta, settings }) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open) setMessage(buildWhatsAppMessage({ calc, meta, settings }))
  }, [open, calc, meta, settings])

  const send = () => {
    openWhatsApp({ phone, message })
    onClose?.()
  }

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 13)
    if (!d) return ''
    if (d.length <= 2) return `+${d}`
    if (d.length <= 4) return `+${d.slice(0,2)} (${d.slice(2)}`
    if (d.length <= 6) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4)}`
    if (d.length <= 10) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
    return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,5)} ${d.slice(5,9)}-${d.slice(9,13)}`
  }

  return (
    <Modal
      open={open} onClose={onClose} title="Enviar para WhatsApp" wide
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-accent" onClick={send}>
            <Icon name="whatsapp" className="w-4 h-4" /> Abrir WhatsApp
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="label block mb-1.5">Telefone do comprador (com DDD e país)</span>
          <input
            className="input"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            placeholder="+55 (11) 9 0000-0000"
            inputMode="tel"
          />
          <span className="text-xs text-fg-muted mt-1.5 block">
            Se deixar em branco, o WhatsApp abrirá para você escolher o contato.
          </span>
        </label>
        <label className="block">
          <span className="label block mb-1.5">Mensagem (editável)</span>
          <textarea
            className="input font-mono text-xs leading-relaxed"
            rows={14}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </label>
      </div>
    </Modal>
  )
}
