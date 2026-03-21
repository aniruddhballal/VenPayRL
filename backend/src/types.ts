export interface Invoice {
  id: string
  vendor: string
  amount: number
  dueDate: number
  penaltyRate: number
  paid: boolean
  delayed: number
}

export interface LogEntry {
  day: number
  vendor: string
  action: 'FULL_PAY' | 'PARTIAL_PAY' | 'DELAYED' | 'OVERDUE'
  amount: string
  reward: string
}

export interface SimState {
  day: number
  cash: number
  totalReward: number
  invoices: Invoice[]
  log: LogEntry[]
}

export interface AgentAction {
  invoiceId: string
  type: 'full' | 'partial' | 'delay'
  amount?: number
}

export type AgentType = 'rule' | 'random' | 'heuristic' | 'qtable' | 'dqn'

export interface ScenarioConfig {
  id: string
  label: string
  description: string
  cash: number
  invoices: Omit<Invoice, 'id' | 'paid' | 'delayed'>[]
  stochastic?: boolean
  lateFeeVariance?: number   // 0–1, e.g. 0.2 = ±20%
  cashInflowMean?: number    // mean daily cash inflow
}

export interface Metrics {
  totalReward:    number
  finalCash:      number
  cashDelta:      number
  totalPenalties: number
  invoicesPaid:   number
  invoicesUnpaid: number
}

export interface EpisodeResult {
  episode:  number
  metrics:  Metrics
  loss?:    number
  epsilon?: number
}

export interface AgentScenarioStats {
  agentType:     AgentType
  scenarioId:    string
  avgReward:     number
  stdReward:     number
  avgFinalCash:  number
  avgPenalties:  number
  winner:        boolean
}

export interface BenchmarkResult {
  scenarioId: string
  stats:      AgentScenarioStats[]
}

export interface QAgentConfig {
  alpha:        number
  gamma:        number
  epsilonDecay: number
  epsilonMin:   number
}

export interface DQNConfig {
  gamma:        number
  epsilonDecay: number
  epsilonMin:   number
  batchSize:    number
  memorySize:   number
  learningRate: number
}

export interface HyperparamSweepConfig {
  param1:  keyof QAgentConfig | keyof DQNConfig
  values1: number[]
  param2?: keyof QAgentConfig | keyof DQNConfig
  values2?: number[]
  episodes: number
  seeds:    number
  agentType: 'qtable' | 'dqn'
  scenarioId: string
}

export interface SweepResult {
  param1Val:  number
  param2Val?: number
  avgReward:  number
  stdReward:  number
}

export interface ActionRecord {
  day:      number
  invoiceId: string
  vendor:   string
  action:   'full' | 'partial' | 'delay' | 'overdue'
}