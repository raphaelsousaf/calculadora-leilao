import jsPDF from 'jspdf'
import { brl, pct, formatDateBR } from './format'

export function buildPDF({ calc, meta, settings }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 48
  let y = 56

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor('#1d1d1f')
  doc.text(settings?.nome || 'Leiloeiro', M, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#6e6e73')
  const contactParts = [settings?.telefone, settings?.email, settings?.documento].filter(Boolean)
  if (contactParts.length) { y += 16; doc.text(contactParts.join('  ·  '), M, y) }

  y += 22
  doc.setDrawColor('#e8e8ed'); doc.line(M, y, W - M, y); y += 28

  // Title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor('#1d1d1f')
  doc.text('Demonstrativo de Arremate', M, y); y += 22

  // Meta
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#424245')
  const metaLines = [
    meta?.comprador && ['Comprador', meta.comprador],
    meta?.lote && ['Lote', meta.lote],
    meta?.processo && ['Processo', meta.processo],
    meta?.categoria && ['Categoria', [meta.categoria, meta.subcategoria].filter(Boolean).join(' / ')],
    meta?.descricao && ['Descrição', meta.descricao],
    meta?.dataLeilao && ['Data do leilão', formatDateBR(meta.dataLeilao)],
  ].filter(Boolean)

  metaLines.forEach(([k, v]) => {
    doc.setTextColor('#6e6e73'); doc.text(k, M, y)
    doc.setTextColor('#1d1d1f'); doc.text(String(v), M + 120, y, { maxWidth: W - M - 120 - M })
    y += 16
  })
  if (metaLines.length) y += 10

  // Values card
  const rows = [
    ['Valor de arremate', brl(calc.bid)],
    ['Entrada (25%)', brl(calc.entry)],
    [`Comissão do leiloeiro (${pct(calc.commissionPct)})`, brl(calc.commission)],
    ['Total à vista', brl(calc.upfront), true],
    ['Saldo a parcelar (75%)', brl(calc.remaining)],
    [`Parcelas (${calc.installments}x sem juros)`, brl(calc.installment) + ' / mês'],
    ['Total geral', brl(calc.total), true],
  ]

  doc.setDrawColor('#e8e8ed'); doc.setFillColor('#f5f5f7')
  doc.roundedRect(M, y, W - 2 * M, rows.length * 26 + 20, 10, 10, 'FD')
  y += 22

  rows.forEach(([k, v, strong]) => {
    doc.setFont('helvetica', strong ? 'bold' : 'normal')
    doc.setFontSize(strong ? 11 : 10)
    doc.setTextColor(strong ? '#0b0b0d' : '#424245')
    doc.text(k, M + 16, y)
    doc.text(v, W - M - 16, y, { align: 'right' })
    y += 26
  })

  y += 24
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#a1a1a6')
  doc.text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, M, y)

  return doc
}

export function openPDF({ calc, meta, settings }) {
  const doc = buildPDF({ calc, meta, settings })
  doc.save(`arremate-${(meta?.lote || 'sem-lote').toString().replace(/\s+/g, '-')}.pdf`)
}
