import { brl, pct, formatDateBR, digitsOnly } from './format'

export function buildWhatsAppMessage({ calc, meta, settings }) {
  const lines = []
  if (settings?.nome) lines.push(`*${settings.nome}*`)
  const contact = [settings?.telefone, settings?.email].filter(Boolean).join(' · ')
  if (contact) lines.push(contact)
  if (settings?.documento) lines.push(settings.documento)
  if (lines.length) lines.push('')

  lines.push('*Demonstrativo de Arremate*')
  lines.push('')

  if (meta?.comprador)   lines.push(`Comprador: ${meta.comprador}`)
  if (meta?.lote)        lines.push(`Lote: ${meta.lote}`)
  if (meta?.processo)    lines.push(`Processo: ${meta.processo}`)
  if (meta?.categoria)   lines.push(`Categoria: ${[meta.categoria, meta.subcategoria].filter(Boolean).join(' / ')}`)
  if (meta?.descricao)   lines.push(`Descrição: ${meta.descricao}`)
  if (meta?.dataLeilao)  lines.push(`Data do leilão: ${formatDateBR(meta.dataLeilao)}`)
  if (meta?.comprador || meta?.lote || meta?.processo || meta?.categoria || meta?.descricao || meta?.dataLeilao) lines.push('')

  lines.push(`Valor de arremate: *${brl(calc.bid)}*`)
  lines.push(`Entrada (25%): ${brl(calc.entry)}`)
  lines.push(`Comissão leiloeiro (${pct(calc.commissionPct)}): ${brl(calc.commission)}`)
  lines.push(`Carta de fiança${calc.suretyPct ? ` (${pct(calc.suretyPct)})` : ''}: ${brl(calc.surety ?? 0)}`)
  lines.push(`*Custo inicial: ${brl(calc.upfront)}*`)
  lines.push(`_Entrada + comissão + carta de fiança_`)
  lines.push('')
  lines.push(`Saldo a parcelar: ${brl(calc.remaining)}`)
  lines.push(`${calc.installments}x sem juros: ${brl(calc.installment)} /mês`)
  lines.push('')
  lines.push(`*Total geral: ${brl(calc.total)}*`)

  return lines.join('\n')
}

export function openWhatsApp({ phone, message }) {
  const digits = digitsOnly(phone)
  const encoded = encodeURIComponent(message)
  const url = digits
    ? `https://wa.me/${digits}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
