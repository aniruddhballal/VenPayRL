import * as tf from '@tensorflow/tfjs'
import type { SimState, AgentAction, DQNConfig } from '../types'

export const defaultDQNConfig: DQNConfig = {
  gamma: 0.95,
  epsilonDecay: 0.995,
  epsilonMin: 0.05,
  batchSize: 32,
  memorySize: 2000,
  learningRate: 0.001,
}

// State vector per invoice: [cashRatio, daysUntilDue (norm), penaltyRate, delayed (norm), overdueCount (norm)]
const STATE_DIM = 5
const ACTION_DIM = 3  // delay=0, partial=1, full=2

interface Experience {
  state: number[]
  action: number
  reward: number
  nextState: number[]
  done: boolean
}

function invoiceStateVec(inv: { amount: number; dueDate: number; penaltyRate: number; delayed: number }, cash: number, maxCash: number, day: number, overdueCount: number): number[] {
  return [
    Math.min(cash / maxCash, 1),
    Math.min(Math.max((inv.dueDate + inv.delayed - day) / 20, -1), 1),
    inv.penaltyRate,
    Math.min(inv.delayed / 10, 1),
    Math.min(overdueCount / 5, 1),
  ]
}

export class DQNAgent {
  private online: tf.LayersModel
  private target: tf.LayersModel
  private memory: Experience[]
  private epsilon: number
  private config: DQNConfig
  private maxCash: number
  private stepCount: number
  public lastLoss: number = 0

  constructor(maxCash = 10000, config: DQNConfig = defaultDQNConfig) {
    this.maxCash = maxCash
    this.config = config
    this.epsilon = 1.0
    this.memory = []
    this.stepCount = 0
    this.online = this.buildNetwork(config.learningRate)
    this.target = this.buildNetwork(config.learningRate)
    this.syncTarget()
  }

  private buildNetwork(lr: number): tf.LayersModel {
    const model = tf.sequential()
    model.add(tf.layers.dense({ inputShape: [STATE_DIM], units: 64, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }))
    model.add(tf.layers.dense({ units: ACTION_DIM, activation: 'linear' }))
    model.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError' })
    return model
  }

  private syncTarget(): void {
    this.target.setWeights(this.online.getWeights())
  }

  updateConfig(config: DQNConfig): void {
    this.config = config
    this.online.dispose()
    this.target.dispose()
    this.online = this.buildNetwork(config.learningRate)
    this.target = this.buildNetwork(config.learningRate)
    this.syncTarget()
  }

  decide(state: SimState): AgentAction[] {
    const actions: AgentAction[] = []
    let remaining = state.cash
    const overdueCount = state.invoices.filter(i => !i.paid && state.day >= i.dueDate + i.delayed).length

    const unpaid = state.invoices
      .filter(i => !i.paid)
      .sort((a, b) => (a.dueDate + a.delayed) - (b.dueDate + b.delayed))

    for (const inv of unpaid) {
      const vec = invoiceStateVec(inv, remaining, this.maxCash, state.day, overdueCount)
      const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed)
      let actionIdx: number

      if (Math.random() < this.epsilon) {
        actionIdx = Math.floor(Math.random() * ACTION_DIM)
      } else {
        const tensor = tf.tensor2d([vec])
        const qVals = this.online.predict(tensor) as tf.Tensor
        const vals = Array.from(qVals.dataSync())
        tensor.dispose()
        qVals.dispose()
        actionIdx = vals.indexOf(Math.max(...vals))
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
    }

    return actions
  }

  remember(state: number[], action: number, reward: number, nextState: number[], done: boolean): void {
    if (this.memory.length >= this.config.memorySize) this.memory.shift()
    this.memory.push({ state, action, reward, nextState, done })
  }

  rememberFromStep(prevState: SimState, actions: AgentAction[], nextState: SimState): void {
    const overdueCount = prevState.invoices.filter(i => !i.paid && prevState.day >= i.dueDate + i.delayed).length
    const nextOverdue = nextState.invoices.filter(i => !i.paid && nextState.day >= i.dueDate + i.delayed).length

    for (const act of actions) {
      const inv = prevState.invoices.find(i => i.id === act.invoiceId)
      const nextInv = nextState.invoices.find(i => i.id === act.invoiceId)
      if (!inv) continue

      const stateVec = invoiceStateVec(inv, prevState.cash, this.maxCash, prevState.day, overdueCount)
      const nextStateVec = nextInv
        ? invoiceStateVec(nextInv, nextState.cash, this.maxCash, nextState.day, nextOverdue)
        : new Array(STATE_DIM).fill(0)

      const logEntry = nextState.log.findLast(l => l.vendor === inv.vendor)
      const reward = logEntry ? parseFloat(logEntry.reward) : 0
      const done = nextInv?.paid ?? true
      const actionIdx = act.type === 'full' ? 2 : act.type === 'partial' ? 1 : 0

      this.remember(stateVec, actionIdx, reward, nextStateVec, done)
    }
  }

  async replay(): Promise<number> {
    if (this.memory.length < this.config.batchSize) return 0

    const batch = []
    const indices = new Set<number>()
    while (indices.size < this.config.batchSize) {
      indices.add(Math.floor(Math.random() * this.memory.length))
    }
    for (const i of indices) batch.push(this.memory[i]!)

    const states = tf.tensor2d(batch.map(e => e.state))
    const nextStates = tf.tensor2d(batch.map(e => e.nextState))

    const qOnline = this.online.predict(states) as tf.Tensor
    const qTarget = this.target.predict(nextStates) as tf.Tensor

    const qOnlineArr = Array.from(qOnline.dataSync())
    const qTargetArr = Array.from(qTarget.dataSync())

    const targets = batch.map((exp, i) => {
      const row = qOnlineArr.slice(i * ACTION_DIM, (i + 1) * ACTION_DIM)
      const tRow = qTargetArr.slice(i * ACTION_DIM, (i + 1) * ACTION_DIM)
      const maxQ = Math.max(...tRow)
      const tgt = exp.done ? exp.reward : exp.reward + this.config.gamma * maxQ
      const out = [...row]
      out[exp.action] = tgt
      return out
    })

    const targetTensor = tf.tensor2d(targets)
    const history = await this.online.fit(states, targetTensor, { epochs: 1, verbose: 0 })
    const loss = (history.history['loss'] as number[])[0] ?? 0

    states.dispose()
    nextStates.dispose()
    qOnline.dispose()
    qTarget.dispose()
    targetTensor.dispose()

    this.lastLoss = loss
    this.stepCount++
    if (this.stepCount % 100 === 0) this.syncTarget()

    return loss
  }

  decayEpsilon(): void {
    this.epsilon = Math.max(this.config.epsilonMin, this.epsilon * this.config.epsilonDecay)
  }

  getEpsilon():          number { return this.epsilon  }
  setEpsilon(v: number): void   { this.epsilon = v     }
  resetEpsilon():        void   { this.epsilon = 1.0   }
  getLoss():             number { return this.lastLoss }
}