import { calculate } from './calc.js'

export const DEFAULT_SCENARIO_PCTS = [30, 35, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100]
export const IDEAL_ZONE = { min: 70, max: 85 }

export function buildScenarioMatrix({ appraisal, commissionPct, suretyPct, installments }) {
  const a = Number(appraisal) || 0
  return DEFAULT_SCENARIO_PCTS.map((pct) => {
    const bid = a * (pct / 100)
    const r = calculate({ arremate: bid, commissionPct, suretyPct, installments })
    return {
      pct,
      bid: r.bid,
      entry: r.entry,
      remaining: r.remaining,
      commission: r.commission,
      surety: r.surety,
      upfront: r.upfront,
      installment: r.installment,
      isIdeal: pct >= IDEAL_ZONE.min && pct <= IDEAL_ZONE.max,
    }
  })
}
