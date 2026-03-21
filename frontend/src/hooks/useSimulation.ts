import { useState, useRef } from 'react'
import { getState, resetSim, agentStep, runEpisodes, runExperiment, updateQConfig } from '../api'
import type { SimState, HistoryPoint, AgentType, EpisodePoint, EpisodeResult, BenchmarkResult, QAgentConfig } from '../types'

function computeMovingAvg(results: EpisodeResult[], window = 20): EpisodePoint[] {
  return results.map((r, i) => {
    const slice = results.slice(Math.max(0, i - window + 1), i + 1)
    const avg   = slice.reduce((s, x) => s + x.metrics.totalReward, 0) / slice.length
    return {
      episode:   r.episode,
      reward:    parseFloat(r.metrics.totalReward.toFixed(2)),
      movingAvg: parseFloat(avg.toFixed(2)),
    }
  })
}

export function useSimulation() {
  const [state,            setState]            = useState<SimState | null>(null)
  const [history,          setHistory]          = useState<HistoryPoint[]>([])
  const [running,          setRunning]          = useState(false)
  const [speed,            setSpeed]            = useState(600)
  const [agentType,        setAgentType]        = useState<AgentType>('rule')
  const [scenarioId,       setScenarioId]       = useState('balanced')
  const [seed,             setSeed]             = useState(42)
  const [epsilon,          setEpsilon]          = useState(1.0)
  const [episodeCount,     setEpisodeCount]     = useState(300)
  const [episodeData,      setEpisodeData]      = useState<EpisodePoint[]>([])
  const [trainingRunning,  setTrainingRunning]  = useState(false)
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([])
  const [experimentRunning,setExperimentRunning]= useState(false)
  const [experimentSeeds,  setExperimentSeeds]  = useState(10)
  const [qConfig,          setQConfig]          = useState<QAgentConfig>({
    alpha: 0.1, gamma: 0.95, epsilonDecay: 0.995, epsilonMin: 0.05,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    const s = await getState()
    setState(s)
    setHistory([{ day: s.day, cash: s.cash, reward: s.totalReward }])
  }

  const reset = async () => {
    stopAuto()
    const s = await resetSim(scenarioId, seed)
    setState(s)
    setHistory([{ day: 0, cash: s.cash, reward: 0 }])
    setEpisodeData([])
  }

  const stepAgent = async () => {
    const { state: s, epsilon: eps } = await agentStep(agentType)
    setState(s)
    setEpsilon(eps)
    setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }])
  }

  const startAuto = () => {
    setRunning(true)
    intervalRef.current = setInterval(async () => {
      const { state: s, epsilon: eps } = await agentStep(agentType)
      setState(s)
      setEpsilon(eps)
      setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }])
      if (s.invoices.every(i => i.paid)) stopAuto()
    }, speed)
  }

  const stopAuto = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const startTraining = async () => {
    setTrainingRunning(true)
    setEpisodeData([])
    const { results } = await runEpisodes(agentType, episodeCount, scenarioId)
    setEpisodeData(computeMovingAvg(results))
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

  const saveQConfig = async (config: QAgentConfig) => {
    setQConfig(config)
    await updateQConfig(config)
  }

  return {
    state, history, running, speed, setSpeed,
    agentType, setAgentType,
    scenarioId, setScenarioId,
    seed, setSeed,
    epsilon,
    episodeCount, setEpisodeCount,
    episodeData,
    trainingRunning,
    benchmarkResults,
    experimentRunning,
    experimentSeeds, setExperimentSeeds,
    qConfig, saveQConfig,
    load, reset, stepAgent, startAuto, stopAuto, startTraining, startExperiment,
  }
}