import { Router, type Request, type Response } from 'express'
import { createStateFromScenario, stepSimulation, computeMetrics, isTerminal, makeRng } from './simulation'
import { ruleAgentDecide }      from './agents/ruleAgent'
import { randomAgentDecide }    from './agents/randomAgent'
import { heuristicAgentDecide } from './agents/heuristicAgent'
import { QAgent, defaultQConfig } from './agents/qAgent'
import { scenarios, getScenario } from './scenarios'
import type { SimState, AgentAction, AgentType, EpisodeResult, BenchmarkResult, AgentScenarioStats, QAgentConfig } from './types'

export const router = Router()

let state: SimState         = createStateFromScenario(getScenario('balanced'))
let currentScenarioId       = 'balanced'
let currentSeed             = 42
let qConfig: QAgentConfig   = { ...defaultQConfig }
const qAgent                = new QAgent(10000, qConfig)

function runEpisode(
  agentType: AgentType,
  scenarioId: string,
  seed: number,
  qAgentInstance: QAgent
): { finalState: SimState; initialCash: number } {
  const scenario  = getScenario(scenarioId)
  const rng       = makeRng(seed)
  let epState     = createStateFromScenario(scenario)

  const decide = (s: SimState): AgentAction[] => {
    if (agentType === 'rule')      return ruleAgentDecide(s)
    if (agentType === 'random')    return randomAgentDecide(s, rng)
    if (agentType === 'heuristic') return heuristicAgentDecide(s)
    if (agentType === 'qtable')    return qAgentInstance.decide(s)
    return ruleAgentDecide(s)
  }

  while (!isTerminal(epState)) {
    const prevLog = epState.log.length
    const actions = decide(epState)
    epState = stepSimulation(epState, actions)

    if (agentType === 'qtable') {
      const newEntries = epState.log.slice(prevLog)
      for (const entry of newEntries) {
        const inv = epState.invoices.find(i => i.vendor === entry.vendor)
        if (inv) qAgentInstance.update(inv.id, parseFloat(entry.reward), epState)
      }
      qAgentInstance.decayEpsilon()
    }
  }

  return { finalState: epState, initialCash: scenario.cash }
}

router.get('/state',     (_req, res) => res.json(state))
router.get('/scenarios', (_req, res) => res.json(scenarios))

router.post('/reset', (req: Request, res: Response) => {
  const scenarioId: string = req.body.scenarioId ?? 'balanced'
  const seed: number       = req.body.seed ?? 42
  currentScenarioId        = scenarioId
  currentSeed              = seed
  state = createStateFromScenario(getScenario(scenarioId))
  res.json(state)
})

router.post('/q-config', (req: Request, res: Response) => {
  qConfig = { ...defaultQConfig, ...req.body }
  qAgent.updateConfig(qConfig)
  res.json({ ok: true, config: qConfig })
})

router.post('/agent-step', (req: Request, res: Response) => {
  const agentType: AgentType = req.body.agentType ?? 'rule'
  const rng = makeRng(Date.now())

  const decide = (s: SimState): AgentAction[] => {
    if (agentType === 'rule')      return ruleAgentDecide(s)
    if (agentType === 'random')    return randomAgentDecide(s, rng)
    if (agentType === 'heuristic') return heuristicAgentDecide(s)
    if (agentType === 'qtable')    return qAgent.decide(s)
    return ruleAgentDecide(s)
  }

  const prevLog = state.log.length
  const actions = decide(state)
  state = stepSimulation(state, actions)

  if (agentType === 'qtable') {
    const newEntries = state.log.slice(prevLog)
    for (const entry of newEntries) {
      const inv = state.invoices.find(i => i.vendor === entry.vendor)
      if (inv) qAgent.update(inv.id, parseFloat(entry.reward), state)
    }
  }

  res.json({ state, actions, epsilon: qAgent.getEpsilon() })
})

router.post('/run-episodes', (req: Request, res: Response) => {
  const agentType: AgentType = req.body.agentType ?? 'rule'
  const episodes: number     = Math.min(req.body.episodes ?? 300, 2000)
  const scenarioId: string   = req.body.scenarioId ?? currentScenarioId
  const results: EpisodeResult[] = []

  if (agentType === 'qtable') qAgent.resetEpsilon()

  for (let ep = 0; ep < episodes; ep++) {
    const { finalState, initialCash } = runEpisode(agentType, scenarioId, currentSeed + ep, qAgent)
    results.push({ episode: ep + 1, metrics: computeMetrics(finalState, initialCash) })
  }

  state = createStateFromScenario(getScenario(scenarioId))
  res.json({ results, epsilon: qAgent.getEpsilon() })
})

router.post('/run-experiment', (req: Request, res: Response) => {
  const seeds: number    = req.body.seeds ?? 10
  const episodes: number = req.body.trainingEpisodes ?? 300
  const agentTypes: AgentType[] = ['rule', 'random', 'heuristic', 'qtable']
  const benchmarkResults: BenchmarkResult[] = []

  for (const scenario of scenarios) {
    const statsPerAgent: AgentScenarioStats[] = []

    for (const agentType of agentTypes) {
      // Train Q-agent fresh per scenario before benchmarking
      const freshQ = new QAgent(scenario.cash, qConfig)
      if (agentType === 'qtable') {
        freshQ.resetEpsilon()
        for (let ep = 0; ep < episodes; ep++) {
          runEpisode('qtable', scenario.id, currentSeed + ep, freshQ)
        }
        // Freeze epsilon for eval
        freshQ.updateConfig({ ...qConfig, epsilonMin: 0, epsilonDecay: 1 })
        freshQ['epsilon'] = 0
      }

      const rewards:    number[] = []
      const cashes:     number[] = []
      const penalties:  number[] = []

      for (let s = 0; s < seeds; s++) {
        const { finalState, initialCash } = runEpisode(agentType, scenario.id, currentSeed + s * 100, freshQ)
        const m = computeMetrics(finalState, initialCash)
        rewards.push(m.totalReward)
        cashes.push(m.finalCash)
        penalties.push(m.totalPenalties)
      }

      const avg  = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
      const std  = (arr: number[]) => {
        const mean = avg(arr)
        return Math.sqrt(arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length)
      }

      statsPerAgent.push({
        agentType,
        scenarioId:   scenario.id,
        avgReward:    parseFloat(avg(rewards).toFixed(2)),
        stdReward:    parseFloat(std(rewards).toFixed(2)),
        avgFinalCash: parseFloat(avg(cashes).toFixed(2)),
        avgPenalties: parseFloat(avg(penalties).toFixed(2)),
        winner:       false,
      })
    }

    // Mark winner by highest avgReward
    const best = Math.max(...statsPerAgent.map(s => s.avgReward))
    for (const s of statsPerAgent) s.winner = s.avgReward === best

    benchmarkResults.push({ scenarioId: scenario.id, stats: statsPerAgent })
  }

  res.json(benchmarkResults)
})