import { Router, type Request, type Response } from 'express'
import { createStateFromScenario, stepSimulation, computeMetrics, isTerminal, makeRng } from './simulation'
import { ruleAgentDecide } from './agents/ruleAgent'
import { randomAgentDecide } from './agents/randomAgent'
import { QAgent } from './agents/qAgent'
import { scenarios, getScenario } from './scenarios'
import type { SimState, AgentAction, AgentType, EpisodeResult } from './types'

export const router = Router()

let state: SimState = createStateFromScenario(getScenario('balanced'))
let currentScenarioId = 'balanced'
let currentSeed = 42

const qAgent = new QAgent()

function getAgent(type: AgentType) {
  const rng = makeRng(currentSeed)
  return (s: SimState): AgentAction[] => {
    if (type === 'rule')   return ruleAgentDecide(s)
    if (type === 'random') return randomAgentDecide(s, rng)
    if (type === 'qtable') return qAgent.decide(s)
    return ruleAgentDecide(s)
  }
}

router.get('/state', (_req: Request, res: Response) => res.json(state))

router.get('/scenarios', (_req: Request, res: Response) => res.json(scenarios))

router.post('/reset', (req: Request, res: Response) => {
  const scenarioId: string = req.body.scenarioId ?? 'balanced'
  const seed: number = req.body.seed ?? 42
  currentScenarioId = scenarioId
  currentSeed = seed
  state = createStateFromScenario(getScenario(scenarioId))
  res.json(state)
})

router.post('/agent-step', (req: Request, res: Response) => {
  const agentType: AgentType = req.body.agentType ?? 'rule'
  const decide = getAgent(agentType)
  const actions = decide(state)
  const prevLog = state.log.length
  state = stepSimulation(state, actions)

  // Q-table update after step
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
  const episodes: number = Math.min(req.body.episodes ?? 300, 2000)
  const scenarioId: string = req.body.scenarioId ?? currentScenarioId
  const scenario = getScenario(scenarioId)
  const results: EpisodeResult[] = []

  // Reset Q-agent epsilon for fresh training run
  if (agentType === 'qtable') qAgent.resetEpsilon()

  for (let ep = 0; ep < episodes; ep++) {
    const seed = currentSeed + ep
    const rng = makeRng(seed)
    let epState = createStateFromScenario(scenario)

    const decide = (s: SimState): AgentAction[] => {
      if (agentType === 'rule')   return ruleAgentDecide(s)
      if (agentType === 'random') return randomAgentDecide(s, rng)
      if (agentType === 'qtable') return qAgent.decide(s)
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
          if (inv) qAgent.update(inv.id, parseFloat(entry.reward), epState)
        }
        qAgent.decayEpsilon()
      }
    }

    results.push({
      episode: ep + 1,
      metrics: computeMetrics(epState, scenario.cash),
    })
  }

  // Update live state to last episode
  state = createStateFromScenario(scenario)
  res.json({ results, epsilon: qAgent.getEpsilon() })
})