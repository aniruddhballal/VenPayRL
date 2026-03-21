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
  action: string
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

export type AgentType = 'rule' | 'random' | 'heuristic' | 'qtable'

export interface ScenarioConfig {
  id: string
  label: string
  description: string
  cash: number
}

export interface Metrics {
  totalReward:    number
  finalCash:      number
  totalPenalties: number
  invoicesPaid:   number
  invoicesUnpaid: number
}

export interface EpisodeResult {
  episode: number
  metrics: Metrics
}

export interface EpisodePoint {
  episode:   number
  reward:    number
  movingAvg: number
}

export interface HistoryPoint {
  day:    number
  cash:   number
  reward: number
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