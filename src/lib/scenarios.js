import { calculate } from './calc.js'

export const DEFAULT_SCENARIO_PCTS = [30, 35, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100]
export const DEFAULT_THRESHOLDS = { t1: 70, t2: 85, t3: 95 }

/**
 * Classifica um cenário em uma faixa de viabilidade (4 tiers configuráveis).
 * Limites inclusivos no piso de cada faixa (`pct <= t1` excellent, etc.).
 *
 * - excellent   (pct ≤ T1, default 70)  — verde   (oportunidade clara)
 * - good        (T1 < pct ≤ T2, default 85) — amber (zona recomendada)
 * - marginal    (T2 < pct ≤ T3, default 95) — laranja (atenção)
 * - over-market (pct > T3)               — vermelho (sem desconto)
 */
export function tierFor(pct, thresholds = DEFAULT_THRESHOLDS) {
  const { t1, t2, t3 } = thresholds
  if (pct <= t1) return 'excellent'
  if (pct <= t2) return 'good'
  if (pct <= t3) return 'marginal'
  return 'over-market'
}

export const TIER_LABELS = {
  excellent: 'Excelente',
  good: 'Bom',
  marginal: 'Marginal',
  'over-market': 'Acima do mercado',
}

export function buildScenarioMatrix({ appraisal, commissionPct, suretyPct, installments, thresholds = DEFAULT_THRESHOLDS }) {
  const a = Number(appraisal) || 0
  return DEFAULT_SCENARIO_PCTS.map((pct) => {
    const bid = a * (pct / 100)
    const r = calculate({ arremate: bid, commissionPct, suretyPct, installments })
    const tier = tierFor(pct, thresholds)
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
    }
  })
}
