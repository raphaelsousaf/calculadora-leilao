import { describe, it, expect } from 'vitest'
import { calculate } from './calc.js'

describe('calculate() with suretyPct', () => {
  it('Test 1: suretyPct=5 retorna surety correto e upfront inclui surety', () => {
    const r = calculate({ arremate: 61000, commissionPct: 5, suretyPct: 5, installments: 30 })
    expect(r.surety).toBe(3050)
    expect(r.upfront).toBe(r.entry + r.commission + 3050)
  })

  it('Test 2: suretyPct=0 retorna surety=0 e upfront sem surety', () => {
    const r = calculate({ arremate: 61000, commissionPct: 5, suretyPct: 0, installments: 30 })
    expect(r.surety).toBe(0)
    expect(r.upfront).toBe(r.entry + r.commission)
  })

  it('Test 3: sem suretyPct (undefined) retorna surety=0 (backwards-compat)', () => {
    const r = calculate({ arremate: 61000, commissionPct: 5, installments: 30 })
    expect(r.surety).toBe(0)
    expect(r.upfront).toBe(r.entry + r.commission)
  })

  it('Test 4: caso canônico linha 70% (R$42.700, 5%, 1%, 30x)', () => {
    const r = calculate({ arremate: 42700, commissionPct: 5, suretyPct: 1, installments: 30 })
    expect(r.entry).toBe(10675)
    expect(r.commission).toBe(2135)
    expect(r.surety).toBe(427)
    expect(r.upfront).toBe(13237)
    expect(r.remaining).toBe(32025)
    expect(r.installment).toBe(1067.5)
  })

  it('Test 5: suretyPct=10 (acceptance criterion 1 do SPEC)', () => {
    const r = calculate({ arremate: 61000, commissionPct: 5, suretyPct: 10, installments: 30 })
    expect(r.surety).toBe(6100)
    expect(r.upfront).toBe(r.entry + r.commission + 6100)
  })
})
