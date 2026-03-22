import type { SimState, AgentAction } from '../types'

export function ruleAgentDecide(state: SimState): AgentAction[] {
  const { day, invoices } = state
  const actions: AgentAction[] = []
  let remaining = state.cash

  const unpaid = invoices
    .filter(i => !i.paid && i.amount >= 1)
    .sort((a, b) => {
      // sort by days until due ascending — most urgent first
      const daysA = (a.dueDate + a.delayed) - day
      const daysB = (b.dueDate + b.delayed) - day
      return daysA - daysB
    })

  const paid = new Set<string>()

  // First pass — pay in urgency order if affordable (use original amount as threshold)
  for (const inv of unpaid) {
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)
    if (remaining >= inv.amount) {
      actions.push({ invoiceId: inv.id, type: 'full' })
      remaining -= cost
      paid.add(inv.id)
    }
  }

  // Second pass — catch any cheaper invoices skipped in first pass
  for (const inv of unpaid) {
    if (paid.has(inv.id)) continue
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)
    if (remaining >= inv.amount) {
      actions.push({ invoiceId: inv.id, type: 'full' })
      remaining -= cost
      paid.add(inv.id)
    }
  }

  // Third pass — partial payments on remaining invoices
  // pay proportionally based on penalty cost to reduce the most expensive first
  const stillUnpaid = unpaid.filter(i => !paid.has(i.id))
  if (stillUnpaid.length > 0 && remaining > 1) {
    // sort remaining by daily penalty cost descending — chip away at the costliest first
    const byPenaltyCost = [...stillUnpaid].sort(
      (a, b) => (b.penaltyRate * b.amount) - (a.penaltyRate * a.amount)
    )
    for (const inv of byPenaltyCost) {
      if (remaining < 1) break
      // pay up to 50% of remaining cash toward this invoice
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