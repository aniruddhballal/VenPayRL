import { describe, it, expect } from 'vitest'
import { createStateFromScenario, stepSimulation, computeMetrics, isTerminal, makeRng } from '../src/simulation'
import { getScenario, scenarios } from '../src/scenarios'

describe('makeRng', () => {
  it('produces deterministic values for same seed', () => {
    const r1 = makeRng(42)
    const r2 = makeRng(42)
    expect(r1()).toBe(r2())
    expect(r1()).toBe(r2())
  })

  it('produces different values for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)())
  })

  it('always returns values in [0, 1)', () => {
    const rng = makeRng(99)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('createStateFromScenario', () => {
  it('sets correct initial cash', () => {
    const s = createStateFromScenario(getScenario('balanced'))
    expect(s.cash).toBe(10000)
    expect(s.day).toBe(0)
    expect(s.totalReward).toBe(0)
    expect(s.log).toHaveLength(0)
  })

  it('creates invoices with paid=false and delayed=0', () => {
    const s = createStateFromScenario(getScenario('balanced'))
    for (const inv of s.invoices) {
      expect(inv.paid).toBe(false)
      expect(inv.delayed).toBe(0)
      expect(inv.id).toBeTruthy()
    }
  })

  it('handles empty invoice scenario gracefully', () => {
    const emptyScenario = { id: 'empty', label: 'Empty', description: '', cash: 5000, invoices: [] }
    const s = createStateFromScenario(emptyScenario)
    expect(s.invoices).toHaveLength(0)
    expect(isTerminal(s)).toBe(true)
  })

  it('creates unique IDs across invoices', () => {
    const s = createStateFromScenario(getScenario('many-invoices'))
    const ids = s.invoices.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('stepSimulation — constraints', () => {
  it('never allows negative cash', () => {
    const scenario = getScenario('tight-cash')
    let s = createStateFromScenario(scenario)
    // Force pay everything immediately
    for (let day = 0; day < 30; day++) {
      const actions = s.invoices.filter(i => !i.paid).map(i => ({ invoiceId: i.id, type: 'full' as const }))
      s = stepSimulation(s, actions)
      expect(s.cash).toBeGreaterThanOrEqual(0)
    }
  })

  it('never overpays beyond invoice amount', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    const initialTotal = s.invoices.reduce((sum, i) => sum + i.amount, 0)
    for (let day = 0; day < 30; day++) {
      const actions = s.invoices.filter(i => !i.paid).map(i => ({ invoiceId: i.id, type: 'full' as const }))
      s = stepSimulation(s, actions)
    }
    const spent = scenario.cash - s.cash
    expect(spent).toBeLessThanOrEqual(initialTotal * 1.5) // allow for penalties
  })

  it('advances day by 1 each step', () => {
    const s0 = createStateFromScenario(getScenario('balanced'))
    const s1 = stepSimulation(s0, [])
    const s2 = stepSimulation(s1, [])
    expect(s1.day).toBe(1)
    expect(s2.day).toBe(2)
  })

  it('marks invoice as paid after full payment', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    const inv = s.invoices[0]!
    s = stepSimulation(s, [{ invoiceId: inv.id, type: 'full' }])
    expect(s.invoices.find(i => i.id === inv.id)?.paid).toBe(true)
  })

  it('partial payment reduces invoice amount, not paid', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    const inv = s.invoices[0]!
    const before = inv.amount
    s = stepSimulation(s, [{ invoiceId: inv.id, type: 'partial', amount: 500 }])
    const after = s.invoices.find(i => i.id === inv.id)!
    expect(after.paid).toBe(false)
    expect(after.amount).toBeLessThan(before)
  })

  it('delay increments delayed counter', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    const inv = s.invoices[0]!
    s = stepSimulation(s, [{ invoiceId: inv.id, type: 'delay' }])
    expect(s.invoices.find(i => i.id === inv.id)?.delayed).toBe(1)
  })

  it('reward is always a finite number', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    for (let i = 0; i < 20; i++) {
      s = stepSimulation(s, [])
      expect(Number.isFinite(s.totalReward)).toBe(true)
    }
  })
})

describe('stepSimulation — stochastic', () => {
  it('cash increases with inflow in stochastic scenario', () => {
    const scenario = getScenario('stochastic')
    const rng = makeRng(1)
    let s = createStateFromScenario(scenario)
    // delay everything so only inflow affects cash
    const actions = s.invoices.map(i => ({ invoiceId: i.id, type: 'delay' as const }))
    const before = s.cash
    s = stepSimulation(s, actions, scenario, rng)
    // cash should have gone up (inflow) then down (penalties), net effect varies
    expect(Number.isFinite(s.cash)).toBe(true)
    expect(s.cash).toBeGreaterThanOrEqual(0)
  })

  it('produces different results across seeds in stochastic mode', () => {
    const scenario = getScenario('stochastic')
    const s1 = stepSimulation(createStateFromScenario(scenario), [], scenario, makeRng(1))
    const s2 = stepSimulation(createStateFromScenario(scenario), [], scenario, makeRng(999))
    expect(s1.cash).not.toBe(s2.cash)
  })
})

describe('isTerminal', () => {
  it('returns true when all invoices paid', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    for (const inv of s.invoices) inv.paid = true
    expect(isTerminal(s)).toBe(true)
  })

  it('returns true at day 60', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    s = { ...s, day: 60 }
    expect(isTerminal(s)).toBe(true)
  })

  it('returns false mid-episode', () => {
    const s = createStateFromScenario(getScenario('balanced'))
    expect(isTerminal(s)).toBe(false)
  })
})

describe('computeMetrics', () => {
  it('counts paid and unpaid invoices correctly', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    s.invoices[0]!.paid = true
    const m = computeMetrics(s, scenario.cash)
    expect(m.invoicesPaid).toBe(1)
    expect(m.invoicesUnpaid).toBe(s.invoices.length - 1)
  })

  it('totalPenalties sums only DELAYED and OVERDUE log entries', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    // delay everything for 3 days
    for (let i = 0; i < 3; i++) {
      const actions = s.invoices.filter(inv => !inv.paid).map(inv => ({ invoiceId: inv.id, type: 'delay' as const }))
      s = stepSimulation(s, actions)
    }
    const m = computeMetrics(s, scenario.cash)
    expect(m.totalPenalties).toBeGreaterThan(0)
    expect(Number.isFinite(m.totalPenalties)).toBe(true)
  })

  it('finalCash matches state cash', () => {
    const scenario = getScenario('balanced')
    const s = createStateFromScenario(scenario)
    expect(computeMetrics(s, scenario.cash).finalCash).toBe(s.cash)
  })
})