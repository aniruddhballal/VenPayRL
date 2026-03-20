import type { SimState, AgentAction } from '../types'
import { makeRng } from '../simulation'

// Accepts optional seeded rng for reproducibility
export function randomAgentDecide(state: SimState, rng = makeRng(Date.now())): AgentAction[] {
  const actions: AgentAction[] = []
  let remaining = state.cash

  for (const inv of state.invoices.filter(i => !i.paid)) {
    const roll = rng()
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)

    if (roll < 0.33 && remaining >= cost) {
      actions.push({ invoiceId: inv.id, type: 'full' })
      remaining -= cost
    } else if (roll < 0.66 && remaining > 0) {
      const partial = Math.min(cost * 0.4, remaining)
      actions.push({ invoiceId: inv.id, type: 'partial', amount: partial })
      remaining -= partial
    } else {
      actions.push({ invoiceId: inv.id, type: 'delay' })
    }
  }

  return actions
}