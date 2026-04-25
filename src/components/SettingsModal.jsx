import { useState, useEffect } from 'react'
import { Modal } from './Modal'

export function SettingsModal({ open, onClose, settings, onSave }) {
  const [form, setForm] = useState(settings || {})
  useEffect(() => { if (open) setForm(settings || {}) }, [open, settings])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSave = () => { onSave?.(form); onClose?.() }

  return (
    <Modal
      open={open} onClose={onClose} title="Configurações do leiloeiro"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave}>Salvar</button>
        </>
      }
    >
      <p className="text-sm text-fg-muted mb-4">Esses dados aparecem no cabeçalho do PDF e da mensagem do WhatsApp.</p>
      <div className="space-y-4">
        <Field label="Nome / Escritório">
          <input className="input" value={form.nome || ''} onChange={e => update('nome', e.target.value)} placeholder="Ex: João Silva Leiloeiro Oficial" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Telefone">
            <input className="input" value={form.telefone || ''} onChange={e => update('telefone', e.target.value)} placeholder="(31) 9 0000-0000" />
          </Field>
          <Field label="E-mail">
            <input type="email" className="input" value={form.email || ''} onChange={e => update('email', e.target.value)} placeholder="contato@exemplo.com" />
          </Field>
        </div>
        <Field label="CNPJ ou CPF">
          <input className="input" value={form.documento || ''} onChange={e => update('documento', e.target.value)} placeholder="00.000.000/0000-00" />
        </Field>
      </div>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label block mb-1.5">{label}</span>
      {children}
    </label>
  )
}
