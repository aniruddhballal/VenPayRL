import { v4 as uuid } from 'uuid'
import type { SimState, AgentAction, Metrics, ScenarioConfig } from './types'

export function makeRng(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function createStateFromScenario(scenario: ScenarioConfig): SimState {
  return {
    day: 0,
    cash: scenario.cash,
    totalReward: 0,
    invoices: scenario.invoices.map(inv => ({ ...inv, id: uuid(), paid: false, delayed: 0 })),
    log: [],
  }
}

export function stepSimulation(
  state: SimState,
  actions: AgentAction[],
  scenario?: ScenarioConfig,
  rng?: () => number
): SimState {
  const next: SimState = structuredClone(state)
  next.day += 1

  // Stochastic cash inflow
  if (scenario?.stochastic && scenario.cashInflowMean && rng) {
    const inflow = scenario.cashInflowMean * (0.5 + rng())
    next.cash   += inflow
  }

  const actionMap = new Map(actions.map(a => [a.invoiceId, a]))
  let stepReward  = 0

  for (const inv of next.invoices) {
    if (inv.paid) continue

    const action = actionMap.get(inv.id)

    // Stochastic penalty variance
    const penaltyMult = (scenario?.stochastic && scenario.lateFeeVariance && rng)
      ? 1 + (rng() * 2 - 1) * scenario.lateFeeVariance
      : 1

    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)

    if (action?.type === 'full') {
      if (next.cash < cost) {
        inv.delayed += 1
        const penalty = inv.amount * inv.penaltyRate * penaltyMult
        stepReward   -= penalty
        next.log.push({ day: next.day, vendor: inv.vendor, action: 'DELAYED', amount: penalty.toFixed(2), reward: (-penalty).toFixed(2) })
        continue
      }
      next.cash     -= cost
      const r        = 10 - inv.delayed * 2
      stepReward    += r
      next.log.push({ day: next.day, vendor: inv.vendor, action: 'FULL_PAY', amount: cost.toFixed(2), reward: r.toFixed(2) })
      inv.paid = true

    } else if (action?.type === 'partial') {
      const partial  = Math.min(action.amount ?? inv.amount * 0.4, next.cash, inv.amount)
      if (partial <= 0) {
        inv.delayed += 1
        const penalty = inv.amount * inv.penaltyRate * penaltyMult
        stepReward   -= penalty
        next.log.push({ day: next.day, vendor: inv.vendor, action: 'DELAYED', amount: penalty.toFixed(2), reward: (-penalty).toFixed(2) })
        continue
      }
      next.cash  -= partial
      inv.amount -= partial
      stepReward -= 2
      next.log.push({ day: next.day, vendor: inv.vendor, action: 'PARTIAL_PAY', amount: partial.toFixed(2), reward: '-2' })

    } else if (action?.type === 'delay') {
      inv.delayed += 1
      const penalty  = inv.amount * inv.penaltyRate * penaltyMult
      stepReward    -= penalty
      next.log.push({ day: next.day, vendor: inv.vendor, action: 'DELAYED', amount: penalty.toFixed(2), reward: (-penalty).toFixed(2) })

    } else if (next.day >= inv.dueDate + inv.delayed) {
      inv.delayed += 1
      const penalty  = inv.amount * inv.penaltyRate * 2 * penaltyMult
      stepReward    -= penalty
      next.log.push({ day: next.day, vendor: inv.vendor, action: 'OVERDUE', amount: penalty.toFixed(2), reward: (-penalty).toFixed(2) })
    }
  }

  stepReward       += next.cash * 0.0005
  next.totalReward  = parseFloat((next.totalReward + stepReward).toFixed(2))
  next.cash         = parseFloat(next.cash.toFixed(2))
  return next
}

export function computeMetrics(state: SimState, initialCash: number): Metrics {
  const totalPenalties = state.log
    .filter(e => e.action === 'DELAYED' || e.action === 'OVERDUE')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
  return {
    totalReward:    state.totalReward,
    finalCash:      state.cash,
    cashDelta:      parseFloat((state.cash - initialCash).toFixed(2)),
    totalPenalties: parseFloat(totalPenalties.toFixed(2)),
    invoicesPaid:   state.invoices.filter(i => i.paid).length,
    invoicesUnpaid: state.invoices.filter(i => !i.paid).length,
  }
}

export function isTerminal(state: SimState): boolean {
  return state.invoices.every(i => i.paid) || state.day >= 60
}