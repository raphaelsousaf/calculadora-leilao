import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Icon } from './Icon'
import { useAuth } from '../lib/auth'
import { fetchProfile, updateProfile } from '../lib/data'
import { PhoneBRInput } from './PhoneBRInput'

export function ProfileModal({ open, onClose, onToast }) {
  const { user, signOut, updatePassword } = useAuth()
  const [whatsapp, setWhatsapp] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !user) return
    setError(''); setPwd(''); setPwd2('')
    setLoadingProfile(true)
    fetchProfile(user.id)
      .then(p => setWhatsapp(p?.whatsapp || ''))
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [open, user])

  const handleSaveProfile = async () => {
    setError(''); setSavingProfile(true)
    try {
      await updateProfile(user.id, { whatsapp })
      onToast?.('Perfil atualizado')
    } catch (err) {
      setError(err?.message || 'Erro ao salvar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePwd = async () => {
    setError('')
    if (pwd.length < 6) return setError('A nova senha deve ter pelo menos 6 caracteres.')
    if (pwd !== pwd2) return setError('As senhas não coincidem.')
    setSavingPwd(true)
    try {
      await updatePassword(pwd)
      setPwd(''); setPwd2('')
      onToast?.('Senha alterada')
    } catch (err) {
      setError(err?.message || 'Erro ao trocar senha')
    } finally {
      setSavingPwd(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    onClose?.()
  }

  return (
    <Modal open={open} onClose={onClose} title="Meu perfil">
      <div className="space-y-6">
        <div className="rounded-xl bg-soft border border-line p-4">
          <div className="text-[11px] uppercase tracking-[0.08em] text-fg-muted font-medium">E-mail</div>
          <div className="text-sm text-fg mt-0.5 break-all">{user?.email}</div>
        </div>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-fg">Dados de contato</h4>
          <Field label="WhatsApp">
            <PhoneBRInput value={whatsapp} onChange={setWhatsapp} disabled={loadingProfile} />
          </Field>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={handleSaveProfile} disabled={savingProfile || loadingProfile}>
              <Icon name="check" className="w-4 h-4" /> {savingProfile ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </section>

        <div className="divider" />

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-fg">Trocar senha</h4>
          <Field label="Nova senha">
            <input type="password" className="input" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </Field>
          <Field label="Confirmar nova senha">
            <input type="password" className="input" value={pwd2} onChange={e => setPwd2(e.target.value)} placeholder="Repita a senha" autoComplete="new-password" />
          </Field>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={handleChangePwd} disabled={savingPwd || !pwd || !pwd2}>
              <Icon name="check" className="w-4 h-4" /> {savingPwd ? 'Salvando…' : 'Alterar senha'}
            </button>
          </div>
        </section>

        {error && (
          <div className="text-sm rounded-xl px-4 py-3 border bg-red-500/10 text-red-600 border-red-500/20">
            {error}
          </div>
        )}

        <div className="divider" />

        <div className="flex justify-between items-center">
          <span className="text-xs text-fg-muted">Sair desta conta neste dispositivo.</span>
          <button className="btn-ghost" onClick={handleLogout}>Sair</button>
        </div>
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
