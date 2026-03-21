import type { SimState, AgentAction } from '../types'

// Urgency score = penaltyRate / max(daysUntilDue, 1)
// Higher score = pay sooner
function urgencyScore(inv: { amount: number; dueDate: number; penaltyRate: number; delayed: number }, day: number): number {
  const daysUntilDue = Math.max((inv.dueDate + inv.delayed) - day, 1)
  return inv.penaltyRate / daysUntilDue
}

export function heuristicAgentDecide(state: SimState): AgentAction[] {
  const { day, invoices } = state
  const actions: AgentAction[] = []
  let remaining = state.cash

  const unpaid = invoices
    .filter(i => !i.paid)
    .sort((a, b) => urgencyScore(b, day) - urgencyScore(a, day)) // highest urgency first

  for (const inv of unpaid) {
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)
    const score = urgencyScore(inv, day)

    if (score >= 0.005 && remaining >= cost) {
      actions.push({ invoiceId: inv.id, type: 'full' })
      remaining -= cost
    } else if (score >= 0.002 && remaining >= cost * 0.4) {
      actions.push({ invoiceId: inv.id, type: 'partial', amount: cost * 0.4 })
      remaining -= cost * 0.4
    } else {
      actions.push({ invoiceId: inv.id, type: 'delay' })
    }
  }

  return actions
}