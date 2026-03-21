import { useState, useRef, useCallback } from 'react'
import { getState, resetSim, agentStep, runEpisodes, runExperiment, updateQConfig, updateDQNConfig, runSweep } from '../api'
import type {
  SimState, HistoryPoint, AgentType, EpisodePoint, EpisodeResult,
  BenchmarkResult, QAgentConfig, DQNConfig, HyperparamSweepConfig, SweepResult, ActionRecord,
} from '../types'

function computeMovingAvg(results: EpisodeResult[], window = 20): EpisodePoint[] {
  return results.map((r, i) => {
    const slice = results.slice(Math.max(0, i - window + 1), i + 1)
    const avg   = slice.reduce((s, x) => s + x.metrics.totalReward, 0) / slice.length
    return {
      episode:   r.episode,
      reward:    parseFloat(r.metrics.totalReward.toFixed(2)),
      movingAvg: parseFloat(avg.toFixed(2)),
      loss:      r.loss     ? parseFloat(r.loss.toFixed(4))     : undefined,
      epsilon:   r.epsilon  ? parseFloat(r.epsilon.toFixed(3))  : undefined,
    }
  })
}

export function useSimulation() {
  const [state,             setState]             = useState<SimState | null>(null)
  const [history,           setHistory]           = useState<HistoryPoint[]>([])
  const [actionHistory,     setActionHistory]     = useState<ActionRecord[]>([])
  const [running,           setRunning]           = useState(false)
  const [speed,             setSpeed]             = useState(600)
  const [agentType,         setAgentType]         = useState<AgentType>('rule')
  const [scenarioId,        setScenarioId]        = useState('balanced')
  const [seed,              setSeed]              = useState(42)
  const [epsilon,           setEpsilon]           = useState(1.0)
  const [loss,              setLoss]              = useState(0)
  const [episodeCount,      setEpisodeCount]      = useState(300)
  const [episodeData,       setEpisodeData]       = useState<EpisodePoint[]>([])
  const [dqnEpisodeData,    setDqnEpisodeData]    = useState<EpisodePoint[]>([])
  const [trainingRunning,   setTrainingRunning]   = useState(false)
  const [benchmarkResults,  setBenchmarkResults]  = useState<BenchmarkResult[]>([])
  const [experimentRunning, setExperimentRunning] = useState(false)
  const [experimentSeeds,   setExperimentSeeds]   = useState(10)
  const [sweepResults,      setSweepResults]      = useState<SweepResult[]>([])
  const [sweepRunning,      setSweepRunning]      = useState(false)
  const [qConfig,           setQConfig]           = useState<QAgentConfig>({ alpha: 0.1, gamma: 0.95, epsilonDecay: 0.995, epsilonMin: 0.05 })
  const [dqnConfig,         setDqnConfig]         = useState<DQNConfig>({ gamma: 0.95, epsilonDecay: 0.995, epsilonMin: 0.05, batchSize: 32, memorySize: 2000, learningRate: 0.001 })
  const [rawEpisodeResults, setRawEpisodeResults] = useState<EpisodeResult[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const s = await getState()
    setState(s)
    setHistory([{ day: s.day, cash: s.cash, reward: s.totalReward }])
  }, [])

  const reset = async () => {
    stopAuto()
    const s = await resetSim(scenarioId, seed)
    setState(s)
    setHistory([{ day: 0, cash: s.cash, reward: 0 }])
    setActionHistory([])
    setEpisodeData([])
    setDqnEpisodeData([])
  }

  const stepAgent = async () => {
    const { state: s, epsilon: eps, loss: l, actionRecords } = await agentStep(agentType)
    setState(s)
    setEpsilon(eps)
    setLoss(l)
    setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }])
    setActionHistory(h => [...h, ...actionRecords])
  }

  const startAuto = () => {
    setRunning(true)
    intervalRef.current = setInterval(async () => {
      const { state: s, epsilon: eps, loss: l, actionRecords } = await agentStep(agentType)
      setState(s)
      setEpsilon(eps)
      setLoss(l)
      setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }])
      setActionHistory(h => [...h, ...actionRecords])
      if (s.invoices.every(i => i.paid)) stopAuto()
    }, speed)
  }

  const stopAuto = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const startTraining = async () => {
    setTrainingRunning(true)
    const setter = agentType === 'dqn' ? setDqnEpisodeData : setEpisodeData
    setter([])
    const { results } = await runEpisodes(agentType, episodeCount, scenarioId)
    setRawEpisodeResults(results)
    setter(computeMovingAvg(results))
    setTrainingRunning(false)
    const s = await resetSim(scenarioId, seed)
    setState(s)
    setHistory([{ day: 0, cash: s.cash, reward: 0 }])
  }

  const startExperiment = async () => {
    setExperimentRunning(true)
    setBenchmarkResults([])
    const results = await runExperiment(experimentSeeds, episodeCount)
    setBenchmarkResults(results)
    setExperimentRunning(false)
  }

  const startSweep = async (config: HyperparamSweepConfig) => {
    setSweepRunning(true)
    setSweepResults([])
    const results = await runSweep(config)
    setSweepResults(results)
    setSweepRunning(false)
  }

  const saveQConfig = async (config: QAgentConfig) => {
    setQConfig(config)
    await updateQConfig(config)
  }

  const saveDQNConfig = async (config: DQNConfig) => {
    setDqnConfig(config)
    await updateDQNConfig(config)
  }

  return {
    state, history, actionHistory, running, speed, setSpeed,
    agentType, setAgentType,
    scenarioId, setScenarioId,
    seed, setSeed,
    epsilon, loss,
    episodeCount, setEpisodeCount,
    episodeData, dqnEpisodeData,
    trainingRunning,
    benchmarkResults,
    experimentRunning,
    experimentSeeds, setExperimentSeeds,
    sweepResults, sweepRunning,
    qConfig, saveQConfig,
    dqnConfig, saveDQNConfig,
    load, reset, stepAgent, startAuto, stopAuto,
    startTraining, startExperiment, startSweep,
    rawEpisodeResults,
  }
}