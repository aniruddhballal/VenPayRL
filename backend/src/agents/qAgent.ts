import type { SimState, AgentAction } from '../types'

const CASH_BUCKETS    = 5
const URGENCY_BUCKETS = 4
const OVERDUE_BUCKETS = 3  // 0, 1, 2+
const ACTIONS         = 3
const STATE_SIZE      = CASH_BUCKETS * URGENCY_BUCKETS * OVERDUE_BUCKETS

export interface QAgentConfig {
  alpha:        number  // learning rate
  gamma:        number  // discount factor
  epsilonDecay: number
  epsilonMin:   number
}

export const defaultQConfig: QAgentConfig = {
  alpha:        0.1,
  gamma:        0.95,
  epsilonDecay: 0.995,
  epsilonMin:   0.05,
}

function cashBucket(cash: number, maxCash: number): number {
  const ratio = Math.min(cash / maxCash, 1)
  return Math.min(Math.floor(ratio * CASH_BUCKETS), CASH_BUCKETS - 1)
}

function urgencyBucket(daysUntilDue: number): number {
  if (daysUntilDue <= 0) return 0
  if (daysUntilDue <= 2) return 1
  if (daysUntilDue <= 5) return 2
  return 3
}

function overdueBucket(overdueCount: number): number {
  if (overdueCount === 0) return 0
  if (overdueCount === 1) return 1
  return 2
}

function stateKey(cb: number, ub: number, ob: number): number {
  return cb * (URGENCY_BUCKETS * OVERDUE_BUCKETS) + ub * OVERDUE_BUCKETS + ob
}

export class QAgent {
  private table:    number[][]
  private epsilon:  number
  private config:   QAgentConfig
  private maxCash:  number
  private lastState: Map<string, { stateKey: number; action: number }>

  constructor(maxCash = 10000, config: QAgentConfig = defaultQConfig) {
    this.maxCash    = maxCash
    this.epsilon    = 1.0
    this.config     = config
    this.lastState  = new Map()
    this.table      = Array.from({ length: STATE_SIZE }, () =>
      Array.from({ length: ACTIONS }, () => Math.random() * 0.01)
    )
  }

  updateConfig(config: QAgentConfig): void {
    this.config = config
  }

  decide(state: SimState): AgentAction[] {
    const actions: AgentAction[] = []
    let remaining = state.cash
    this.lastState.clear()

    const overdueCount = state.invoices.filter(i => !i.paid && state.day >= i.dueDate + i.delayed).length
    const ob = overdueBucket(overdueCount)

    const unpaid = state.invoices
      .filter(i => !i.paid)
      .sort((a, b) => (a.dueDate + a.delayed) - (b.dueDate + b.delayed))

    for (const inv of unpaid) {
      const cb = cashBucket(remaining, this.maxCash)
      const ub = urgencyBucket((inv.dueDate + inv.delayed) - state.day)
      const sk = stateKey(cb, ub, ob)
      const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)

      let actionIdx: number
      if (Math.random() < this.epsilon) {
        actionIdx = Math.floor(Math.random() * ACTIONS)
      } else {
        const qVals = this.table[sk]!
        actionIdx = qVals.indexOf(Math.max(...qVals))
      }

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

  update(invoiceId: string, reward: number, nextState: SimState): void {
    const prev = this.lastState.get(invoiceId)
    if (!prev) return

    const inv = nextState.invoices.find(i => i.id === invoiceId)
    if (!inv || inv.paid) {
      const current = this.table[prev.stateKey]![prev.action]!
      this.table[prev.stateKey]![prev.action] = current + this.config.alpha * (reward - current)
      return
    }

    const overdueCount = nextState.invoices.filter(i => !i.paid && nextState.day >= i.dueDate + i.delayed).length
    const cb     = cashBucket(nextState.cash, this.maxCash)
    const ub     = urgencyBucket((inv.dueDate + inv.delayed) - nextState.day)
    const ob     = overdueBucket(overdueCount)
    const nextSk = stateKey(cb, ub, ob)
    const maxNext = Math.max(...this.table[nextSk]!)

    const current = this.table[prev.stateKey]![prev.action]!
    this.table[prev.stateKey]![prev.action] =
      current + this.config.alpha * (reward + this.config.gamma * maxNext - current)
  }

  decayEpsilon(): void {
    this.epsilon = Math.max(this.config.epsilonMin, this.epsilon * this.config.epsilonDecay)
  }

  getEpsilon():          number { return this.epsilon }
  setEpsilon(v: number): void   { this.epsilon = v    }
  resetEpsilon():        void   { this.epsilon = 1.0  }
}