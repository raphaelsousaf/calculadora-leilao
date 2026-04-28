import { describe, it, expect } from 'vitest'
import { DEFAULT_SCENARIO_PCTS, DEFAULT_THRESHOLDS, TIER_LABELS, tierFor, buildScenarioMatrix } from './scenarios.js'

describe('scenarios', () => {
  it('Test 1: DEFAULT_SCENARIO_PCTS contém os 13 valores na ordem correta', () => {
    expect(DEFAULT_SCENARIO_PCTS).toEqual([30, 35, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100])
  })

  it('Test 2: DEFAULT_THRESHOLDS === { t1: 70, t2: 85, t3: 95 }', () => {
    expect(DEFAULT_THRESHOLDS).toEqual({ t1: 70, t2: 85, t3: 95 })
  })

  it('Test 3: buildScenarioMatrix retorna 13 linhas', () => {
    const rows = buildScenarioMatrix({ appraisal: 61000, commissionPct: 5, suretyPct: 1, installments: 30 })
    expect(rows).toHaveLength(13)
  })

  it('Test 4: linha pct=70 bate o caso canônico do SPEC (fiança sobre saldo)', () => {
    const rows = buildScenarioMatrix({ appraisal: 61000, commissionPct: 5, suretyPct: 1, installments: 30 })
    const row = rows.find((r) => r.pct === 70)
    expect(row.bid).toBe(42700)
    expect(row.entry).toBe(10675)
    expect(row.remaining).toBe(32025)
    expect(row.commission).toBe(2135)
    expect(row.surety).toBe(320.25)
    expect(row.upfront).toBe(13130.25)
    expect(row.installment).toBe(1067.5)
    // 70 ≤ T1=70 inclusive → excellent
    expect(row.tier).toBe('excellent')
  })

  it('Test 5: tierFor com defaults — limites inclusivos', () => {
    expect(tierFor(30)).toBe('excellent')
    expect(tierFor(70)).toBe('excellent')   // T1 inclusive
    expect(tierFor(75)).toBe('good')
    expect(tierFor(85)).toBe('good')        // T2 inclusive
    expect(tierFor(90)).toBe('marginal')
    expect(tierFor(95)).toBe('marginal')    // T3 inclusive
    expect(tierFor(100)).toBe('over-market')
  })

  it('Test 6: tierFor com thresholds customizados', () => {
    const t = { t1: 60, t2: 80, t3: 90 }
    expect(tierFor(60, t)).toBe('excellent')
    expect(tierFor(70, t)).toBe('good')
    expect(tierFor(85, t)).toBe('marginal')
    expect(tierFor(95, t)).toBe('over-market')
  })

  it('Test 7: TIER_LABELS cobre os 4 tiers', () => {
    expect(TIER_LABELS.excellent).toBe('Excelente')
    expect(TIER_LABELS.good).toBe('Bom')
    expect(TIER_LABELS.marginal).toBe('Marginal')
    expect(TIER_LABELS['over-market']).toBe('Acima do mercado')
  })

  it('Test 8: appraisal=0 retorna 13 linhas com bid=0 sem crash', () => {
    const rows = buildScenarioMatrix({ appraisal: 0, commissionPct: 5, suretyPct: 1, installments: 30 })
    expect(rows).toHaveLength(13)
    rows.forEach((r) => {
      expect(r.bid).toBe(0)
      expect(r.entry).toBe(0)
      expect(r.remaining).toBe(0)
      expect(r.commission).toBe(0)
      expect(r.surety).toBe(0)
      expect(r.upfront).toBe(0)
    })
  })
})
