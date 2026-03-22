import axios from 'axios'
import type {
  SimState, AgentType, EpisodeResult, ScenarioConfig,
  BenchmarkResult, QAgentConfig, DQNConfig,
  HyperparamSweepConfig, SweepResult, ActionRecord,
} from './types'

const BASE = import.meta.env.VITE_API_BASE

export const getState     = (): Promise<SimState> =>
  axios.get(`${BASE}/state`).then(r => r.data)

export const getScenarios = (): Promise<ScenarioConfig[]> =>
  axios.get(`${BASE}/scenarios`).then(r => r.data)

export const resetSim     = (scenarioId: string, seed: number): Promise<SimState> =>
  axios.post(`${BASE}/reset`, { scenarioId, seed }).then(r => r.data)

export const agentStep = (agentType: AgentType): Promise<{
  state: SimState; actions: ActionRecord[]; epsilon: number; loss: number; actionRecords: ActionRecord[]
}> => axios.post(`${BASE}/agent-step`, { agentType }).then(r => r.data)

export const runEpisodes = (agentType: AgentType, episodes: number, scenarioId: string): Promise<{ results: EpisodeResult[]; epsilon: number }> =>
  axios.post(`${BASE}/run-episodes`, { agentType, episodes, scenarioId }).then(r => r.data)

export const runExperiment = (seeds: number, trainingEpisodes: number): Promise<BenchmarkResult[]> =>
  axios.post(`${BASE}/run-experiment`, { seeds, trainingEpisodes }).then(r => r.data)

export const updateQConfig  = (config: QAgentConfig): Promise<void> =>
  axios.post(`${BASE}/q-config`, config).then(r => r.data)

export const updateDQNConfig = (config: DQNConfig): Promise<void> =>
  axios.post(`${BASE}/dqn-config`, config).then(r => r.data)

export const runSweep = (config: HyperparamSweepConfig): Promise<SweepResult[]> =>
  axios.post(`${BASE}/hyperparameter-sweep`, config).then(r => r.data)

// Global error interceptor — logs all API failures to console with status
axios.interceptors.response.use(
  res => res,
  err => {
    const status  = err.response?.status ?? 'network error'
    const url     = err.config?.url ?? 'unknown'
    console.error(`[VenPayRL API] ${status} — ${url}`, err.response?.data ?? err.message)
    return Promise.reject(err)
  }
)

export interface HealthCheckResult {
  agentType: AgentType
  reward:    number
  cash:      number
  penalties: number
  pass:      boolean
}

export const runHealthCheck = (): Promise<{ ok: boolean; results: HealthCheckResult[] }> =>
  axios.get(`${BASE}/health-check`).then(r => r.data)

export function streamEpisodes(
  agentType: AgentType,
  episodes: number,
  scenarioId: string,
  onProgress: (episode: number, total: number, result: EpisodeResult) => void,
  onDone: (results: EpisodeResult[], epsilon: number) => void,
  onError: (msg: string) => void,
): () => void {
  const url = `${BASE}/run-episodes-stream?agentType=${agentType}&episodes=${episodes}&scenarioId=${scenarioId}`
  const es  = new EventSource(url)

  es.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'progress') onProgress(data.episode, data.total, data.result)
    if (data.type === 'done')     { onDone(data.results, data.epsilon); es.close() }
    if (data.type === 'error')    { onError(data.message); es.close() }
  }

  es.onerror = () => { onError('Stream connection lost'); es.close() }

  return () => es.close() // cleanup function
}

export interface CustomInvoiceInput {
  vendor:      string
  amount:      number
  dueDate:     number
  penaltyRate: number  // as percentage e.g. 5 for 5%
}

export const createCustomScenario = (
  cash: number,
  invoices: CustomInvoiceInput[],
  cashInflowPerDay?: number
): Promise<{ scenario: ScenarioConfig; state: SimState }> =>
  axios.post(`${BASE}/custom-scenario`, { cash, invoices, cashInflowPerDay }).then(r => r.data)