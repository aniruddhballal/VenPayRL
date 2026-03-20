import type { SimState, AgentAction } from '../types'

// State key: cashBucket (0-4) × urgency bucket (0-3)
// Actions per invoice: 0=delay, 1=partial, 2=full
const CASH_BUCKETS = 5
const URGENCY_BUCKETS = 4
const ACTIONS = 3
const STATE_SIZE = CASH_BUCKETS * URGENCY_BUCKETS

function cashBucket(cash: number, maxCash: number): number {
  const ratio = Math.min(cash / maxCash, 1)
  return Math.min(Math.floor(ratio * CASH_BUCKETS), CASH_BUCKETS - 1)
}

function urgencyBucket(daysUntilDue: number): number {
  if (daysUntilDue <= 0) return 0   // overdue
  if (daysUntilDue <= 2) return 1   // urgent
  if (daysUntilDue <= 5) return 2   // upcoming
  return 3                           // safe
}

function stateKey(cashB: number, urgencyB: number): number {
  return cashB * URGENCY_BUCKETS + urgencyB
}

export class QAgent {
  private table: number[][]  // [stateKey][action]
  private epsilon: number
  private epsilonMin: number
  private epsilonDecay: number
  private alpha: number   // learning rate
  private gamma: number   // discount factor
  private maxCash: number
  private lastState: Map<string, { stateKey: number; action: number }>

  constructor(maxCash = 10000) {
    this.maxCash = maxCash
    this.epsilon = 1.0
    this.epsilonMin = 0.05
    this.epsilonDecay = 0.995
    this.alpha = 0.1
    this.gamma = 0.95
    this.lastState = new Map()

    // Init Q-table to small random values to break ties
    this.table = Array.from({ length: STATE_SIZE }, () =>
      Array.from({ length: ACTIONS }, () => Math.random() * 0.01)
    )
  }

  decide(state: SimState): AgentAction[] {
    const actions: AgentAction[] = []
    let remaining = state.cash
    this.lastState.clear()

    const unpaid = state.invoices.filter(i => !i.paid)
      .sort((a, b) => (a.dueDate + a.delayed) - (b.dueDate + b.delayed))

    for (const inv of unpaid) {
      const cb = cashBucket(remaining, this.maxCash)
      const ub = urgencyBucket((inv.dueDate + inv.delayed) - state.day)
      const sk = stateKey(cb, ub)
      const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)

      let actionIdx: number
      if (Math.random() < this.epsilon) {
        // Explore
        actionIdx = Math.floor(Math.random() * ACTIONS)
      } else {
        // Exploit — pick best valid action
        const qVals = this.table[sk]!
        actionIdx = qVals.indexOf(Math.max(...qVals))
      }

      // Map action index → actual action, respecting constraints
      if (actionIdx === 2 && remaining >= cost) {
        actions.push({ invoiceId: inv.id, type: 'full' })
        remaining -= cost
      } else if (actionIdx === 1 && remaining > 0) {
        const partial = Math.min(cost * 0.4, remaining)
        actions.push({ invoiceId: inv.id, type: 'partial', amount: partial })
        remaining -= partial
      } else {
        actionIdx = 0
        actions.push({ invoiceId: inv.id, type: 'delay' })
      }

      this.lastState.set(inv.id, { stateKey: sk, action: actionIdx })
    }

    return actions
  }

  // Call after each step with the reward received
  update(invoiceId: string, reward: number, nextState: SimState): void {
    const prev = this.lastState.get(invoiceId)
    if (!prev) return

    const inv = nextState.invoices.find(i => i.id === invoiceId)
    if (!inv || inv.paid) {
      // Terminal for this invoice — no next state value
      const current = this.table[prev.stateKey]![prev.action]!
      this.table[prev.stateKey]![prev.action] = current + this.alpha * (reward - current)
      return
    }

    const cb = cashBucket(nextState.cash, this.maxCash)
    const ub = urgencyBucket((inv.dueDate + inv.delayed) - nextState.day)
    const nextSk = stateKey(cb, ub)
    const maxNext = Math.max(...this.table[nextSk]!)

    const current = this.table[prev.stateKey]![prev.action]!
    this.table[prev.stateKey]![prev.action] =
      current + this.alpha * (reward + this.gamma * maxNext - current)
  }

  decayEpsilon(): void {
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay)
  }

  getEpsilon(): number {
    return this.epsilon
  }

  resetEpsilon(): void {
    this.epsilon = 1.0
  }
}