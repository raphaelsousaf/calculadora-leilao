export const brl = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const pct = (n) =>
  (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + '%'

// Parse BRL-style string "1.234,56" -> 1234.56
export const parseBRL = (s) => {
  if (typeof s === 'number') return s
  if (!s) return 0
  const cleaned = String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

export const formatBRLInput = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  const n = parseInt(digits, 10) / 100
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const digitsOnly = (s) => String(s ?? '').replace(/\D/g, '')

export const formatDateBR = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}
