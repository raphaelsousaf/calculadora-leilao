import { describe, it, expect } from 'vitest'
import { addDaysISO, buildSchedule } from './schedule.js'

describe('addDaysISO', () => {
  it('soma dias dentro do mesmo ano', () => {
    expect(addDaysISO('2026-05-01', 30)).toBe('2026-05-31')
    expect(addDaysISO('2026-05-31', 30)).toBe('2026-06-30')
  })

  it('atravessa virada de ano', () => {
    expect(addDaysISO('2025-12-15', 30)).toBe('2026-01-14')
  })

  it('atravessa anos bissextos sem ajuste', () => {
    // 2024 é bissexto: fev tem 29 dias
    expect(addDaysISO('2024-02-15', 30)).toBe('2024-03-16')
  })

  it('aceita 0 dias', () => {
    expect(addDaysISO('2026-05-01', 0)).toBe('2026-05-01')
  })
})

describe('buildSchedule', () => {
  it('caso canônico: 30x intervalo 30 a partir de 2026-05-01', () => {
    const sched = buildSchedule(30, '2026-05-01', 30, 1067.5)
    expect(sched).toHaveLength(30)
    expect(sched[0]).toEqual({ index: 1, dueDate: '2026-05-31', value: 1067.5 })
    // 2026-05-01 + 30*30 = 900 dias → 2028-10-17
    expect(sched[29].dueDate).toBe('2028-10-17')
    expect(sched[29].index).toBe(30)
    sched.forEach((p) => expect(p.value).toBe(1067.5))
  })

  it('intervalo 45 dias produz datas progressivas corretas', () => {
    const sched = buildSchedule(3, '2026-05-01', 45, 100)
    expect(sched[0].dueDate).toBe('2026-06-15')
    expect(sched[1].dueDate).toBe('2026-07-30')
    expect(sched[2].dueDate).toBe('2026-09-13')
  })

  it('dataLeilao vazia retorna array vazio', () => {
    expect(buildSchedule(30, '', 30, 100)).toEqual([])
    expect(buildSchedule(30, null, 30, 100)).toEqual([])
    expect(buildSchedule(30, undefined, 30, 100)).toEqual([])
  })

  it('installments=0 retorna array vazio', () => {
    expect(buildSchedule(0, '2026-05-01', 30, 100)).toEqual([])
  })

  it('intervalo inválido (≤0) retorna array vazio', () => {
    expect(buildSchedule(3, '2026-05-01', 0, 100)).toEqual([])
    expect(buildSchedule(3, '2026-05-01', -5, 100)).toEqual([])
  })
})
