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
    .filter(i => !i.paid && i.amount >= 1)
    .sort((a, b) => urgencyScore(b, day) - urgencyScore(a, day))

  const paid = new Set<string>()

  // First pass — pay in urgency order, use original amount as affordability threshold
  // not compounded cost — pay sooner, stop penalty accumulating
  for (const inv of unpaid) {
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)
    if (remaining >= inv.amount) {
      actions.push({ invoiceId: inv.id, type: 'full' })
      remaining -= cost
      paid.add(inv.id)
    }
  }

  // Second pass — catch any invoices skipped due to cash ordering
  for (const inv of unpaid) {
    if (paid.has(inv.id)) continue
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)
    if (remaining >= inv.amount) {
      actions.push({ invoiceId: inv.id, type: 'full' })
      remaining -= cost
      paid.add(inv.id)
    }
  }

  // Third pass — partial payments sorted by daily penalty cost descending
  // chip away at the costliest unpaid invoices with 50% of remaining cash
  const stillUnpaid = unpaid.filter(i => !paid.has(i.id))
  if (stillUnpaid.length > 0 && remaining > 1) {
    const byPenaltyCost = [...stillUnpaid].sort(
      (a, b) => (b.penaltyRate * b.amount) - (a.penaltyRate * a.amount)
    )
    for (const inv of byPenaltyCost) {
      if (remaining < 1) break
      const partial = Math.min(remaining * 0.5, inv.amount)
      if (partial >= 1) {
        actions.push({ invoiceId: inv.id, type: 'partial', amount: partial })
        remaining -= partial
        paid.add(inv.id)
      }
    }
  }

  // Delay everything still unpaid
  for (const inv of unpaid) {
    if (!paid.has(inv.id)) {
      actions.push({ invoiceId: inv.id, type: 'delay' })
    }
  }

  return actions
}