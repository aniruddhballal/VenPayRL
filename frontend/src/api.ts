import axios from 'axios'
import type { SimState, AgentType, EpisodeResult, ScenarioConfig, BenchmarkResult, QAgentConfig } from './types'

const BASE = 'http://localhost:3001/api'

export const getState     = (): Promise<SimState> =>
  axios.get(`${BASE}/state`).then(r => r.data)

export const getScenarios = (): Promise<ScenarioConfig[]> =>
  axios.get(`${BASE}/scenarios`).then(r => r.data)

export const resetSim = (scenarioId: string, seed: number): Promise<SimState> =>
  axios.post(`${BASE}/reset`, { scenarioId, seed }).then(r => r.data)

export const agentStep = (agentType: AgentType): Promise<{ state: SimState; actions: unknown[]; epsilon: number }> =>
  axios.post(`${BASE}/agent-step`, { agentType }).then(r => r.data)

export const runEpisodes = (agentType: AgentType, episodes: number, scenarioId: string): Promise<{ results: EpisodeResult[]; epsilon: number }> =>
  axios.post(`${BASE}/run-episodes`, { agentType, episodes, scenarioId }).then(r => r.data)

export const runExperiment = (seeds: number, trainingEpisodes: number): Promise<BenchmarkResult[]> =>
  axios.post(`${BASE}/run-experiment`, { seeds, trainingEpisodes }).then(r => r.data)

export const updateQConfig = (config: QAgentConfig): Promise<void> =>
  axios.post(`${BASE}/q-config`, config).then(r => r.data)