import { describe, it, expect } from 'vitest'
import { calculate } from './calc.js'

describe('calculate() with suretyPct', () => {
  it('Test 1: suretyPct=5 — surety = 5% do saldo (75%), upfront inclui surety', () => {
    const r = calculate({ arremate: 61000, commissionPct: 5, suretyPct: 5, installments: 30 })
    // 75% × 61000 = 45750 (saldo); 5% × 45750 = 2287.5
    expect(r.surety).toBe(2287.5)
    expect(r.upfront).toBe(r.entry + r.commission + 2287.5)
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

  it('Test 4: caso canônico linha 70% (arremate=R$42.700, com=5%, fia=1%, 30x) — fiança sobre saldo', () => {
    const r = calculate({ arremate: 42700, commissionPct: 5, suretyPct: 1, installments: 30 })
    expect(r.entry).toBe(10675)
    expect(r.remaining).toBe(32025)
    expect(r.commission).toBe(2135)
    // 1% × 32025 = 320.25
    expect(r.surety).toBe(320.25)
    // 10675 + 2135 + 320.25 = 13130.25
    expect(r.upfront).toBe(13130.25)
    expect(r.installment).toBe(1067.5)
  })

  it('Test 5: suretyPct=10 — 10% do saldo (75%)', () => {
    const r = calculate({ arremate: 61000, commissionPct: 5, suretyPct: 10, installments: 30 })
    // 75% × 61000 = 45750; 10% × 45750 = 4575
    expect(r.surety).toBe(4575)
    expect(r.upfront).toBe(r.entry + r.commission + 4575)
  })
})
