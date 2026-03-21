import type { SimState, AgentAction } from '../types'

export function ruleAgentDecide(state: SimState): AgentAction[] {
  const { day, invoices } = state
  const actions: AgentAction[] = []
  let remaining = state.cash

  const unpaid = invoices
    .filter(i => !i.paid)
    .sort((a, b) => (a.dueDate + a.delayed) - (b.dueDate + b.delayed))

  for (const inv of unpaid) {
    const cost     = inv.amount * (1 + inv.penaltyRate * inv.delayed)
    const daysLeft = (inv.dueDate + inv.delayed) - day

    if (remaining >= cost) {
      actions.push({ invoiceId: inv.id, type: 'full' })
      remaining -= cost
    } else if (daysLeft <= 1 && remaining >= cost * 0.4) {
      actions.push({ invoiceId: inv.id, type: 'partial', amount: cost * 0.4 })
      remaining -= cost * 0.4
    } else {
      actions.push({ invoiceId: inv.id, type: 'delay' })
    }
  }

  return actions
}