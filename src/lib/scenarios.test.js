import { describe, it, expect } from 'vitest'
import { DEFAULT_SCENARIO_PCTS, IDEAL_ZONE, buildScenarioMatrix } from './scenarios.js'

describe('scenarios', () => {
  it('Test 1: DEFAULT_SCENARIO_PCTS contém os 13 valores na ordem correta', () => {
    expect(DEFAULT_SCENARIO_PCTS).toEqual([30, 35, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 100])
  })

  it('Test 2: IDEAL_ZONE === { min: 70, max: 85 }', () => {
    expect(IDEAL_ZONE).toEqual({ min: 70, max: 85 })
  })

  it('Test 3: buildScenarioMatrix retorna 13 linhas', () => {
    const rows = buildScenarioMatrix({ appraisal: 61000, commissionPct: 5, suretyPct: 1, installments: 30 })
    expect(rows).toHaveLength(13)
  })

  it('Test 4: linha pct=70 bate o caso canônico do SPEC', () => {
    const rows = buildScenarioMatrix({ appraisal: 61000, commissionPct: 5, suretyPct: 1, installments: 30 })
    const row = rows.find((r) => r.pct === 70)
    expect(row.bid).toBe(42700)
    expect(row.entry).toBe(10675)
    expect(row.remaining).toBe(32025)
    expect(row.commission).toBe(2135)
    // fiança = 1% sobre saldo (32025) = 320.25
    expect(row.surety).toBe(320.25)
    // upfront = 10675 + 2135 + 320.25 = 13130.25
    expect(row.upfront).toBe(13130.25)
    expect(row.installment).toBe(1067.5)
    expect(row.isIdeal).toBe(true)
  })

  it('Test 5: isIdeal — pct=30 false, pct=85 true, pct=88 false', () => {
    const rows = buildScenarioMatrix({ appraisal: 61000, commissionPct: 5, suretyPct: 1, installments: 30 })
    expect(rows.find((r) => r.pct === 30).isIdeal).toBe(false)
    expect(rows.find((r) => r.pct === 85).isIdeal).toBe(true)
    expect(rows.find((r) => r.pct === 88).isIdeal).toBe(false)
  })

  it('Test 6: appraisal=0 retorna 13 linhas com bid=0 sem crash', () => {
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
