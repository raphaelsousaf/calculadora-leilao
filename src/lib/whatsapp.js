import { brl, pct, formatDateBR, digitsOnly } from './format'
import { buildSchedule } from './schedule'

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

  // Margem estimada (R6) — quando revenda preenchida
  if (calc.revendaEsperada > 0) {
    const totalEfetivo = calc.bid + calc.commission + (calc.surety ?? 0)
    const margem = calc.revendaEsperada - totalEfetivo
    const margemPct = (margem / calc.revendaEsperada) * 100
    const sinal = margem >= 0 ? '💰' : '⚠️'
    lines.push('')
    lines.push(`${sinal} *Margem estimada: ${brl(margem)} (${margemPct.toFixed(1)}%)*`)
    lines.push(`_Revenda esperada: ${brl(calc.revendaEsperada)}_`)
  }

  // Cronograma resumo (R7) — primeira/última parcela quando data leilão preenchida
  if (meta?.dataLeilao && calc.installments > 0) {
    const intervalo = Number(calc.intervaloDias) || 30
    const sched = buildSchedule(calc.installments, meta.dataLeilao, intervalo, calc.installment)
    if (sched.length > 0) {
      lines.push('')
      lines.push(`📅 Primeira parcela: ${formatDateBR(sched[0].dueDate)} · Última: ${formatDateBR(sched[sched.length - 1].dueDate)}`)
    }
  }

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
