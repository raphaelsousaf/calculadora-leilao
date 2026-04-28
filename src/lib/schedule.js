/**
 * Soma N dias a uma data ISO (YYYY-MM-DD), retornando ISO.
 * Sem timezone — usa Date local. Para o uso no app (cronograma de leilão),
 * apenas a data calendário importa, não horários.
 */
export function addDaysISO(iso, days) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + Number(days || 0))
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/**
 * Gera cronograma de N parcelas a partir da data do leilão e intervalo em dias.
 * Cada parcela tem `index` (1..N), `dueDate` (ISO YYYY-MM-DD) e `value`.
 * A primeira parcela vence `intervaloDias` após a data do leilão.
 *
 * Retorna array vazio quando inputs inválidos (sem data, 0 parcelas, intervalo ≤ 0).
 */
export function buildSchedule(installments, dataLeilaoISO, intervaloDias, installmentValue) {
  const n = Number(installments) || 0
  const interval = Number(intervaloDias) || 0
  if (!dataLeilaoISO || n <= 0 || interval <= 0) return []
  const value = Number(installmentValue) || 0
  const out = []
  for (let i = 1; i <= n; i++) {
    out.push({
      index: i,
      dueDate: addDaysISO(dataLeilaoISO, interval * i),
      value,
    })
  }
  return out
}
