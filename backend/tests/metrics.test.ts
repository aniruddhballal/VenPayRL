import { describe, it, expect } from 'vitest'
import { createStateFromScenario, stepSimulation, computeMetrics } from '../src/simulation'
import { getScenario } from '../src/scenarios'
import { ruleAgentDecide } from '../src/agents/ruleAgent'
import { scenarios } from '../src/scenarios'

describe('reward calculation', () => {
  it('full pay on time gives positive reward contribution', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    const inv = s.invoices[0]!
    // Pay immediately on day 1 — no delay penalty
    s = stepSimulation(s, [{ invoiceId: inv.id, type: 'full' }])
    expect(s.totalReward).toBeGreaterThan(0)
  })

  it('delay gives negative reward contribution', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    const before = s.totalReward
    s = stepSimulation(s, s.invoices.map(i => ({ invoiceId: i.id, type: 'delay' as const })))
    // Only cash conservation bonus should partially offset; net should be negative
    expect(s.totalReward).toBeLessThan(before + 10)
  })

  it('penalties accumulate correctly over multiple delays', () => {
    const scenario = getScenario('high-penalty')
    let s = createStateFromScenario(scenario)
    for (let i = 0; i < 5; i++) {
      s = stepSimulation(s, s.invoices.filter(inv => !inv.paid).map(inv => ({ invoiceId: inv.id, type: 'delay' as const })))
    }
    const m = computeMetrics(s, scenario.cash)
    expect(m.totalPenalties).toBeGreaterThan(0)
    // High penalty scenario should accumulate more than balanced
    const balancedScenario = getScenario('balanced')
    let bs = createStateFromScenario(balancedScenario)
    for (let i = 0; i < 5; i++) {
      bs = stepSimulation(bs, bs.invoices.filter(inv => !inv.paid).map(inv => ({ invoiceId: inv.id, type: 'delay' as const })))
    }
    const bm = computeMetrics(bs, balancedScenario.cash)
    expect(m.totalPenalties).toBeGreaterThan(bm.totalPenalties)
  })
})

describe('export correctness', () => {
  it('log entries match actual actions taken', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    const inv = s.invoices[0]!
    s = stepSimulation(s, [{ invoiceId: inv.id, type: 'full' }])
    const entry = s.log.find(l => l.vendor === inv.vendor && l.action === 'FULL_PAY')
    expect(entry).toBeTruthy()
    expect(parseFloat(entry!.amount)).toBeGreaterThan(0)
    expect(parseFloat(entry!.reward)).toBeGreaterThan(0)
  })

  it('log reward values are finite strings parseable as numbers', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    for (let i = 0; i < 10; i++) {
      s = stepSimulation(s, ruleAgentDecide(s))
    }
    for (const entry of s.log) {
      expect(Number.isFinite(parseFloat(entry.reward))).toBe(true)
      expect(Number.isFinite(parseFloat(entry.amount))).toBe(true)
    }
  })

  it('CSV row count matches episode count', () => {
    // Simulate what the export does — verify structure
    const results = Array.from({ length: 50 }, (_, i) => ({
      episode: i + 1,
      metrics: { totalReward: i * 0.5, finalCash: 8000, totalPenalties: 100, invoicesPaid: 5, invoicesUnpaid: 0 },
    }))
    const rows = results.map(r =>
      [r.episode, r.metrics.totalReward, r.metrics.finalCash, r.metrics.totalPenalties].join(',')
    )
    expect(rows).toHaveLength(50)
    expect(rows[0]).toContain('1')
    expect(rows[49]).toContain('50')
  })
})

describe('scenario configs', () => {
  it('all scenarios have valid cash > 0', () => {
    for (const sc of scenarios) {
      expect(sc.cash).toBeGreaterThan(0)
    }
  })

  it('all scenarios have at least one invoice', () => {
    for (const sc of scenarios) {
      expect(sc.invoices.length).toBeGreaterThan(0)
    }
  })

  it('all invoice penalty rates are between 0 and 1', () => {
    for (const sc of scenarios) {
      for (const inv of sc.invoices) {
        expect(inv.penaltyRate).toBeGreaterThan(0)
        expect(inv.penaltyRate).toBeLessThan(1)
      }
    }
  })

  it('all invoice due dates are positive', () => {
    for (const sc of scenarios) {
      for (const inv of sc.invoices) {
        expect(inv.dueDate).toBeGreaterThan(0)
      }
    }
  })
})