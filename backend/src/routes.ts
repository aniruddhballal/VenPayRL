import { Router, type Request, type Response } from 'express'
import { createStateFromScenario, stepSimulation, computeMetrics, isTerminal, makeRng } from './simulation'
import { ruleAgentDecide }              from './agents/ruleAgent'
import { randomAgentDecide }            from './agents/randomAgent'
import { heuristicAgentDecide }         from './agents/heuristicAgent'
import { QAgent, defaultQConfig }       from './agents/qAgent'
import { DQNAgent, defaultDQNConfig }   from './agents/dqnAgent'
import { scenarios, getScenario }       from './scenarios'
import type {
  SimState, AgentAction, AgentType,
  EpisodeResult, BenchmarkResult, AgentScenarioStats,
  QAgentConfig, DQNConfig, HyperparamSweepConfig, SweepResult,
} from './types'

export const router = Router()

let state: SimState       = createStateFromScenario(getScenario('balanced'))
let currentScenarioId     = 'balanced'
let currentSeed           = 42
let qConfig: QAgentConfig = { ...defaultQConfig }
let dqnConfig: DQNConfig  = { ...defaultDQNConfig }
const qAgent              = new QAgent(10000, qConfig)
const dqnAgent            = new DQNAgent(10000, dqnConfig)

async function runEpisode(
  agentType: AgentType,
  scenarioId: string,
  seed: number,
  qInst: QAgent,
  dqnInst: DQNAgent,
): Promise<{ finalState: SimState; initialCash: number; loss: number }> {
  const scenario = getScenario(scenarioId)
  const rng      = makeRng(seed)
  let epState    = createStateFromScenario(scenario)
  let totalLoss  = 0
  let lossSteps  = 0

  const decide = (s: SimState): AgentAction[] => {
    if (agentType === 'rule')      return ruleAgentDecide(s)
    if (agentType === 'random')    return randomAgentDecide(s, rng)
    if (agentType === 'heuristic') return heuristicAgentDecide(s)
    if (agentType === 'qtable')    return qInst.decide(s)
    if (agentType === 'dqn')       return dqnInst.decide(s)
    return ruleAgentDecide(s)
  }

  while (!isTerminal(epState)) {
    const prevState = epState
    const prevLog   = epState.log.length
    const actions   = decide(epState)
    epState = stepSimulation(epState, actions, scenario, rng)

    if (agentType === 'qtable') {
      const newEntries = epState.log.slice(prevLog)
      for (const entry of newEntries) {
        const inv = epState.invoices.find(i => i.vendor === entry.vendor)
        if (inv) qInst.update(inv.id, parseFloat(entry.reward), epState)
      }
      qInst.decayEpsilon()
    }

    if (agentType === 'dqn') {
      dqnInst.rememberFromStep(prevState, actions, epState)
      const loss = await dqnInst.replay()
      if (loss > 0) { totalLoss += loss; lossSteps++ }
      dqnInst.decayEpsilon()
    }
  }

  return {
    finalState:  epState,
    initialCash: scenario.cash,
    loss:        lossSteps > 0 ? totalLoss / lossSteps : 0,
  }
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

router.post('/dqn-config', (req: Request, res: Response) => {
  dqnConfig = { ...defaultDQNConfig, ...req.body }
  dqnAgent.updateConfig(dqnConfig)
  res.json({ ok: true, config: dqnConfig })
})

router.post('/agent-step', async (req: Request, res: Response) => {
  const agentType: AgentType = req.body.agentType ?? 'rule'
  const scenario = getScenario(currentScenarioId)
  const rng      = makeRng(Date.now())
  const prevState = state
  const prevLog   = state.log.length
  let actions: AgentAction[]

  if (agentType === 'rule')      actions = ruleAgentDecide(state)
  else if (agentType === 'random')    actions = randomAgentDecide(state, rng)
  else if (agentType === 'heuristic') actions = heuristicAgentDecide(state)
  else if (agentType === 'qtable')    actions = qAgent.decide(state)
  else if (agentType === 'dqn')       actions = dqnAgent.decide(state)
  else actions = ruleAgentDecide(state)

  state = stepSimulation(state, actions, scenario, rng)

  if (agentType === 'qtable') {
    const newEntries = state.log.slice(prevLog)
    for (const entry of newEntries) {
      const inv = state.invoices.find(i => i.vendor === entry.vendor)
      if (inv) qAgent.update(inv.id, parseFloat(entry.reward), state)
    }
  }

  let loss = 0
  if (agentType === 'dqn') {
    dqnAgent.rememberFromStep(prevState, actions, state)
    loss = await dqnAgent.replay()
    dqnAgent.decayEpsilon()
  }

  res.json({
    state, actions,
    epsilon: agentType === 'dqn' ? dqnAgent.getEpsilon() : qAgent.getEpsilon(),
    loss,
    // Action records for visualization
    actionRecords: actions.map(a => ({
      day:       state.day,
      invoiceId: a.invoiceId,
      vendor:    state.invoices.find(i => i.id === a.invoiceId)?.vendor ?? '',
      action:    a.type,
    })),
  })
})

router.post('/run-episodes', async (req: Request, res: Response) => {
  const agentType: AgentType = req.body.agentType ?? 'rule'
  const episodes: number     = Math.min(req.body.episodes ?? 300, 2000)
  const scenarioId: string   = req.body.scenarioId ?? currentScenarioId
  const results: EpisodeResult[] = []

  if (agentType === 'qtable') qAgent.resetEpsilon()
  if (agentType === 'dqn')    dqnAgent.resetEpsilon()

  for (let ep = 0; ep < episodes; ep++) {
    const { finalState, initialCash, loss } = await runEpisode(agentType, scenarioId, currentSeed + ep, qAgent, dqnAgent)
    results.push({
      episode: ep + 1,
      metrics: computeMetrics(finalState, initialCash),
      loss,
      epsilon: agentType === 'dqn' ? dqnAgent.getEpsilon() : qAgent.getEpsilon(),
    })
  }

  state = createStateFromScenario(getScenario(scenarioId))
  res.json({ results, epsilon: agentType === 'dqn' ? dqnAgent.getEpsilon() : qAgent.getEpsilon() })
})

router.post('/run-experiment', async (req: Request, res: Response) => {
  const seeds: number    = req.body.seeds ?? 10
  const episodes: number = req.body.trainingEpisodes ?? 300
  const agentTypes: AgentType[] = ['rule', 'random', 'heuristic', 'qtable', 'dqn']
  const benchmarkResults: BenchmarkResult[] = []

  for (const scenario of scenarios) {
    const statsPerAgent: AgentScenarioStats[] = []

    for (const agentType of agentTypes) {
      const freshQ   = new QAgent(scenario.cash, qConfig)
      const freshDQN = new DQNAgent(scenario.cash, dqnConfig)

      if (agentType === 'qtable') {
        freshQ.resetEpsilon()
        for (let ep = 0; ep < episodes; ep++) {
          await runEpisode('qtable', scenario.id, currentSeed + ep, freshQ, freshDQN)
        }
        freshQ.updateConfig({ ...qConfig, epsilonMin: 0, epsilonDecay: 1 })
        freshQ.setEpsilon(0)
      }

      if (agentType === 'dqn') {
        freshDQN.resetEpsilon()
        for (let ep = 0; ep < episodes; ep++) {
          await runEpisode('dqn', scenario.id, currentSeed + ep, freshQ, freshDQN)
        }
        freshDQN.updateConfig({ ...dqnConfig, epsilonMin: 0, epsilonDecay: 1 })
        freshDQN.setEpsilon(0)
      }

      const rewards: number[] = [], cashes: number[] = [], penalties: number[] = []
      for (let s = 0; s < seeds; s++) {
        const { finalState, initialCash } = await runEpisode(agentType, scenario.id, currentSeed + s * 100, freshQ, freshDQN)
        const m = computeMetrics(finalState, initialCash)
        rewards.push(m.totalReward); cashes.push(m.finalCash); penalties.push(m.totalPenalties)
      }

      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
      const std = (arr: number[]) => Math.sqrt(arr.reduce((s, x) => s + (x - avg(arr)) ** 2, 0) / arr.length)

      statsPerAgent.push({
        agentType, scenarioId: scenario.id,
        avgReward: parseFloat(avg(rewards).toFixed(2)), stdReward: parseFloat(std(rewards).toFixed(2)),
        avgFinalCash: parseFloat(avg(cashes).toFixed(2)), avgPenalties: parseFloat(avg(penalties).toFixed(2)),
        winner: false,
      })
    }

    const best = Math.max(...statsPerAgent.map(s => s.avgReward))
    for (const s of statsPerAgent) s.winner = s.avgReward === best
    benchmarkResults.push({ scenarioId: scenario.id, stats: statsPerAgent })
  }

  res.json(benchmarkResults)
})

router.post('/hyperparameter-sweep', async (req: Request, res: Response) => {
  const config: HyperparamSweepConfig = req.body
  const results: SweepResult[]        = []

  for (const v1 of config.values1) {
    const vals2 = config.values2 ?? [undefined]
    for (const v2 of vals2) {
      const freshQ   = new QAgent(10000, { ...qConfig, [config.param1]: v1, ...(config.param2 && v2 !== undefined ? { [config.param2]: v2 } : {}) })
      const freshDQN = new DQNAgent(10000, { ...dqnConfig, [config.param1]: v1, ...(config.param2 && v2 !== undefined ? { [config.param2]: v2 } : {}) })

      if (config.agentType === 'qtable') freshQ.resetEpsilon()
      if (config.agentType === 'dqn')    freshDQN.resetEpsilon()

      for (let ep = 0; ep < config.episodes; ep++) {
        await runEpisode(config.agentType, config.scenarioId, currentSeed + ep, freshQ, freshDQN)
      }

      const rewards: number[] = []
      for (let s = 0; s < config.seeds; s++) {
        const { finalState, initialCash } = await runEpisode(config.agentType, config.scenarioId, currentSeed + s * 100, freshQ, freshDQN)
        rewards.push(computeMetrics(finalState, initialCash).totalReward)
      }

      const avg = rewards.reduce((a, b) => a + b, 0) / rewards.length
      const std = Math.sqrt(rewards.reduce((s, x) => s + (x - avg) ** 2, 0) / rewards.length)
      results.push({
        param1Val:  v1,
        avgReward:  parseFloat(avg.toFixed(2)),
        stdReward:  parseFloat(std.toFixed(2)),
        ...(v2 !== undefined ? { param2Val: v2 } : {}),
      })
    }
  }

  res.json(results)
})

router.get('/health-check', async (_req: Request, res: Response) => {
  const agentTypes: AgentType[] = ['rule', 'random', 'heuristic', 'qtable', 'dqn']
  const results: { agentType: AgentType; reward: number; cash: number; penalties: number; pass: boolean }[] = []

  const freshQ   = new QAgent(10000, qConfig)
  const freshDQN = new DQNAgent(10000, dqnConfig)

  for (const agentType of agentTypes) {
    const { finalState, initialCash } = await runEpisode(agentType, 'balanced', 42, freshQ, freshDQN)
    const m = computeMetrics(finalState, initialCash)
    results.push({
      agentType,
      reward:    m.totalReward,
      cash:      m.finalCash,
      penalties: m.totalPenalties,
      pass:      Number.isFinite(m.totalReward) && m.finalCash >= 0,
    })
  }

  res.json({ ok: results.every(r => r.pass), results })
})

router.get('/run-episodes-stream', (req: Request, res: Response) => {
  const agentType: AgentType = (req.query['agentType'] as AgentType) ?? 'rule'
  const episodes: number     = Math.min(Number(req.query['episodes'] ?? 300), 2000)
  const scenarioId: string   = (req.query['scenarioId'] as string) ?? currentScenarioId
  const previewEvery         = Math.max(1, Math.floor(episodes / 50)) // stream ~50 updates

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.flushHeaders()

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  if (agentType === 'qtable') qAgent.resetEpsilon()
  if (agentType === 'dqn')    dqnAgent.resetEpsilon()

  const run = async () => {
    const results: EpisodeResult[] = []

    for (let ep = 0; ep < episodes; ep++) {
      const { finalState, initialCash, loss } = await runEpisode(
        agentType, scenarioId, currentSeed + ep, qAgent, dqnAgent
      )
      const result: EpisodeResult = {
        episode: ep + 1,
        metrics: computeMetrics(finalState, initialCash),
        loss,
        epsilon: agentType === 'dqn' ? dqnAgent.getEpsilon() : qAgent.getEpsilon(),
      }
      results.push(result)

      if ((ep + 1) % previewEvery === 0 || ep === episodes - 1) {
        send({ type: 'progress', episode: ep + 1, total: episodes, result })
      }
    }

    state = createStateFromScenario(getScenario(scenarioId))
    send({ type: 'done', results, epsilon: agentType === 'dqn' ? dqnAgent.getEpsilon() : qAgent.getEpsilon() })
    res.end()
  }

  run().catch(err => {
    send({ type: 'error', message: String(err) })
    res.end()
  })
})