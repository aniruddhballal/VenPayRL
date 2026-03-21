import { useState, useRef, useCallback } from 'react'
import {
  getState, resetSim, agentStep, runExperiment,
  updateQConfig, updateDQNConfig, runSweep, runHealthCheck, streamEpisodes,
} from '../api'
import type {
  SimState, HistoryPoint, AgentType, EpisodePoint, EpisodeResult,
  BenchmarkResult, QAgentConfig, DQNConfig, HyperparamSweepConfig,
  SweepResult, ActionRecord, HealthCheckResult,
} from '../types'

function computeMovingAvg(results: EpisodeResult[], window = 20): EpisodePoint[] {
  return results.map((r, i) => {
    const slice = results.slice(Math.max(0, i - window + 1), i + 1)
    const avg   = slice.reduce((s, x) => s + x.metrics.totalReward, 0) / slice.length
    return {
      episode:   r.episode,
      reward:    parseFloat(r.metrics.totalReward.toFixed(2)),
      movingAvg: parseFloat(avg.toFixed(2)),
      loss:      r.loss    ? parseFloat(r.loss.toFixed(4))    : undefined,
      epsilon:   r.epsilon ? parseFloat(r.epsilon.toFixed(3)) : undefined,
    }
  })
}

function appendEpisodePoint(prev: EpisodePoint[], result: EpisodeResult, window = 20): EpisodePoint[] {
  const slice   = [...prev.slice(-(window - 1)), result]
  const avg     = slice.reduce((s, x) => {
    const val = 'metrics' in x ? (x as EpisodeResult).metrics.totalReward : (x as EpisodePoint).reward
    return s + val
  }, 0) / slice.length

  const point: EpisodePoint = {
    episode:   result.episode,
    reward:    parseFloat(result.metrics.totalReward.toFixed(2)),
    movingAvg: parseFloat(avg.toFixed(2)),
    loss:      result.loss    ? parseFloat(result.loss.toFixed(4))    : undefined,
    epsilon:   result.epsilon ? parseFloat(result.epsilon.toFixed(3)) : undefined,
  }
  return [...prev, point]
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
  const [rawEpisodeResults, setRawEpisodeResults] = useState<EpisodeResult[]>([])
  const [trainingRunning,   setTrainingRunning]   = useState(false)
  const [streamProgress,    setStreamProgress]    = useState<{ episode: number; total: number } | null>(null)
  const [benchmarkResults,  setBenchmarkResults]  = useState<BenchmarkResult[]>([])
  const [experimentRunning, setExperimentRunning] = useState(false)
  const [experimentSeeds,   setExperimentSeeds]   = useState(10)
  const [sweepResults,      setSweepResults]      = useState<SweepResult[]>([])
  const [sweepRunning,      setSweepRunning]      = useState(false)
  const [healthResults,     setHealthResults]     = useState<HealthCheckResult[]>([])
  const [healthRunning,     setHealthRunning]     = useState(false)
  const [qConfig,           setQConfig]           = useState<QAgentConfig>({
    alpha: 0.1, gamma: 0.95, epsilonDecay: 0.995, epsilonMin: 0.05,
  })
  const [dqnConfig,         setDqnConfig]         = useState<DQNConfig>({
    gamma: 0.95, epsilonDecay: 0.995, epsilonMin: 0.05,
    batchSize: 32, memorySize: 2000, learningRate: 0.001,
  })

  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamCleanupRef = useRef<(() => void) | null>(null)

  const load = useCallback(async () => {
    const s = await getState()
    setState(s)
    setHistory([{ day: s.day, cash: s.cash, reward: s.totalReward }])
  }, [])

  const reset = async () => {
    stopAuto()
    if (streamCleanupRef.current) { streamCleanupRef.current(); streamCleanupRef.current = null }
    const s = await resetSim(scenarioId, seed)
    setState(s)
    setHistory([{ day: 0, cash: s.cash, reward: 0 }])
    setActionHistory([])
    setEpisodeData([])
    setDqnEpisodeData([])
    setRawEpisodeResults([])
    setStreamProgress(null)
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

  const startTraining = () => {
    // Cancel any existing stream
    if (streamCleanupRef.current) { streamCleanupRef.current(); streamCleanupRef.current = null }

    const isDqn  = agentType === 'dqn'
    const setter = isDqn ? setDqnEpisodeData : setEpisodeData

    setTrainingRunning(true)
    setStreamProgress({ episode: 0, total: episodeCount })
    setter([])
    setRawEpisodeResults([])

    const cleanup = streamEpisodes(
      agentType,
      episodeCount,
      scenarioId,
      // onProgress — update chart incrementally each preview tick
      (episode, total, result) => {
        setStreamProgress({ episode, total })
        if (result.epsilon !== undefined) setEpsilon(result.epsilon)
        if (result.loss    !== undefined) setLoss(result.loss)
        setter(prev => appendEpisodePoint(prev, result))
        setRawEpisodeResults(prev => [...prev, result])
      },
      // onDone — recompute full moving average cleanly from all results
      async (results, eps) => {
        setter(computeMovingAvg(results))
        setRawEpisodeResults(results)
        setEpsilon(eps)
        setTrainingRunning(false)
        setStreamProgress(null)
        streamCleanupRef.current = null
        const s = await resetSim(scenarioId, seed)
        setState(s)
        setHistory([{ day: 0, cash: s.cash, reward: 0 }])
      },
      // onError
      (msg) => {
        console.error('[VenPayRL] Stream error:', msg)
        setTrainingRunning(false)
        setStreamProgress(null)
        streamCleanupRef.current = null
      }
    )

    streamCleanupRef.current = cleanup
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

  const startHealthCheck = async () => {
    setHealthRunning(true)
    const { results } = await runHealthCheck()
    setHealthResults(results)
    setHealthRunning(false)
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
    // sim state
    state, history, actionHistory,
    running, speed, setSpeed,
    // agent + scenario config
    agentType, setAgentType,
    scenarioId, setScenarioId,
    seed, setSeed,
    epsilon, loss,
    // episode training
    episodeCount, setEpisodeCount,
    episodeData, dqnEpisodeData,
    rawEpisodeResults,
    trainingRunning, streamProgress,
    // benchmark + experiment
    benchmarkResults,
    experimentRunning,
    experimentSeeds, setExperimentSeeds,
    // sweep
    sweepResults, sweepRunning,
    // health check
    healthResults, healthRunning,
    // q + dqn config
    qConfig, saveQConfig,
    dqnConfig, saveDQNConfig,
    // actions
    load, reset, stepAgent, startAuto, stopAuto,
    startTraining, startExperiment, startSweep, startHealthCheck,
  }
}