import { calculate } from './calc.js'

export const DEFAULT_SCENARIO_PCTS = [30, 35, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100]
export const IDEAL_ZONE = { min: 70, max: 85 }

/**
 * Classifica um cenário em uma faixa de risco (heatmap).
 * - excellent: 30-35  (desconto altíssimo, oportunidade rara)
 * - good:     50-65  (desconto significativo)
 * - ideal:    70-85  (zona recomendada — mantém destaque amber existente)
 * - caution:  88-90  (pouco desconto, atenção)
 * - high-risk: 100   (sem desconto, máximo risco)
 */
export function tierFor(pct) {
  if (pct <= 35) return 'excellent'
  if (pct <= 65) return 'good'
  if (pct <= 85) return 'ideal'
  if (pct <= 90) return 'caution'
  return 'high-risk'
}

export const TIER_LABELS = {
  excellent: 'Excelente',
  good: 'Bom',
  ideal: 'Ideal',
  caution: 'Atenção',
  'high-risk': 'Sem desconto',
}

export function buildScenarioMatrix({ appraisal, commissionPct, suretyPct, installments }) {
  const a = Number(appraisal) || 0
  return DEFAULT_SCENARIO_PCTS.map((pct) => {
    const bid = a * (pct / 100)
    const r = calculate({ arremate: bid, commissionPct, suretyPct, installments })
    const tier = tierFor(pct)
    return {
      pct,
      bid: r.bid,
      entry: r.entry,
      remaining: r.remaining,
      commission: r.commission,
      surety: r.surety,
      upfront: r.upfront,
      installment: r.installment,
      tier,
      isIdeal: tier === 'ideal',
    }
  })
}
