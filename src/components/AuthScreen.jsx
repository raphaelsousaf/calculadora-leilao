import { useState } from 'react'
import { Icon } from './Icon'
import { useAuth } from '../lib/auth'
import { PhoneBRInput } from './PhoneBRInput'

const MODES = { signin: 'signin', signup: 'signup', reset: 'reset' }

export function AuthScreen() {
  const { signIn, signUp, sendResetEmail } = useAuth()
  const [mode, setMode] = useState(MODES.signin)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setLoading(true)
    try {
      if (mode === MODES.signin) {
        await signIn(email.trim(), password)
      } else if (mode === MODES.signup) {
        if (password.length < 6) throw new Error('Senha deve ter pelo menos 6 caracteres.')
        if (!whatsapp || whatsapp.replace(/\D/g, '').length < 10) throw new Error('Informe um WhatsApp válido.')
        await signUp(email.trim(), password, whatsapp)
        setInfo('Cadastro feito! Verifique seu e-mail e clique no link de confirmação para entrar.')
        setMode(MODES.signin); setPassword('')
      } else if (mode === MODES.reset) {
        await sendResetEmail(email.trim())
        setInfo('Se o e-mail existir, enviamos um link para redefinir a senha.')
        setMode(MODES.signin)
      }
    } catch (err) {
      setError(humanizeError(err))
    } finally {
      setLoading(false)
    }
  }

  const titles = {
    signin: { title: 'Entrar', subtitle: 'Acesse sua conta' },
    signup: { title: 'Criar conta', subtitle: 'Cadastro rápido — leva 30 segundos' },
    reset:  { title: 'Recuperar senha', subtitle: 'Enviaremos um link para seu e-mail' },
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-soft"
               style={{ background: 'rgb(var(--elevated))', color: 'rgb(var(--on-elevated))' }}>
            <Icon name="calculator" className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-fg text-center">{titles[mode].title}</h1>
          <p className="text-sm text-fg-muted text-center mt-1">{titles[mode].subtitle}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="E-mail">
              <input
                type="email" required autoFocus autoComplete="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </Field>

            {mode === MODES.signup && (
              <Field label="WhatsApp">
                <PhoneBRInput value={whatsapp} onChange={setWhatsapp} required />
              </Field>
            )}

            {mode !== MODES.reset && (
              <Field label="Senha">
                <input
                  type="password" required minLength={6}
                  autoComplete={mode === MODES.signin ? 'current-password' : 'new-password'}
                  className="input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === MODES.signup ? 'Mínimo 6 caracteres' : '••••••'}
                />
              </Field>
            )}

            {error && <Banner tone="error">{error}</Banner>}
            {info && <Banner tone="info">{info}</Banner>}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Aguarde…' : titles[mode].title}
            </button>

            <div className="text-center text-sm space-y-2 pt-2">
              {mode === MODES.signin && (
                <>
                  <div>
                    <button type="button" className="text-accent hover:text-accent-hover"
                            onClick={() => { setMode(MODES.reset); setError(''); setInfo('') }}>
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="text-fg-muted">
                    Não tem conta?{' '}
                    <button type="button" className="text-accent hover:text-accent-hover font-medium"
                            onClick={() => { setMode(MODES.signup); setError(''); setInfo('') }}>
                      Cadastre-se
                    </button>
                  </div>
                </>
              )}
              {mode === MODES.signup && (
                <div className="text-fg-muted">
                  Já tem conta?{' '}
                  <button type="button" className="text-accent hover:text-accent-hover font-medium"
                          onClick={() => { setMode(MODES.signin); setError(''); setInfo('') }}>
                    Entrar
                  </button>
                </div>
              )}
              {mode === MODES.reset && (
                <button type="button" className="text-accent hover:text-accent-hover"
                        onClick={() => { setMode(MODES.signin); setError(''); setInfo('') }}>
                  Voltar ao login
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-[11px] text-fg-muted text-center mt-6 px-4">
          Ao criar uma conta, você concorda em receber comunicações sobre a Calculadora de Leilão.
        </p>
      </div>
    </div>
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

function Banner({ tone, children }) {
  const cls = tone === 'error'
    ? 'bg-red-500/10 text-red-600 border-red-500/20'
    : 'bg-accent/10 text-accent border-accent/20'
  return (
    <div className={`text-sm rounded-xl px-4 py-3 border ${cls}`}>
      {children}
    </div>
  )
}

function humanizeError(err) {
  const msg = err?.message || String(err)
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  if (/User already registered/i.test(msg)) return 'Esse e-mail já está cadastrado. Tente entrar.'
  if (/rate limit/i.test(msg)) return 'Muitas tentativas. Aguarde um minuto e tente de novo.'
  if (/password.*(short|6)/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  return msg
}
