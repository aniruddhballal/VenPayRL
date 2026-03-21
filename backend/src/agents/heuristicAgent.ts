import type { SimState, AgentAction } from '../types'

function urgencyScore(inv: { dueDate: number; penaltyRate: number; delayed: number }, day: number): number {
  const daysUntilDue = Math.max((inv.dueDate + inv.delayed) - day, 0.5)
  return inv.penaltyRate / daysUntilDue
}

export function heuristicAgentDecide(state: SimState): AgentAction[] {
  const { day, invoices } = state
  const actions: AgentAction[] = []
  let remaining = state.cash

  const unpaid = invoices
    .filter(i => !i.paid)
    .sort((a, b) => urgencyScore(b, day) - urgencyScore(a, day))

  for (const inv of unpaid) {
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)

    if (remaining >= cost) {
      actions.push({ invoiceId: inv.id, type: 'full' })
      remaining -= cost
    } else if (remaining >= cost * 0.4) {
      actions.push({ invoiceId: inv.id, type: 'partial', amount: cost * 0.4 })
      remaining -= cost * 0.4
    } else {
      actions.push({ invoiceId: inv.id, type: 'delay' })
    }
  }

  return actions
}