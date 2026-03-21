import { describe, it, expect } from 'vitest'
import { createStateFromScenario, stepSimulation, isTerminal, computeMetrics, makeRng } from '../src/simulation'
import { getScenario, scenarios } from '../src/scenarios'
import { ruleAgentDecide } from '../src/agents/ruleAgent'
import { randomAgentDecide } from '../src/agents/randomAgent'
import { heuristicAgentDecide } from '../src/agents/heuristicAgent'
import { QAgent } from '../src/agents/qAgent'

// Helper: run one full episode, return final metrics
function runEpisode(
  decide: (s: ReturnType<typeof createStateFromScenario>) => ReturnType<typeof ruleAgentDecide>,
  scenarioId: string,
  seed = 42
) {
  const scenario = getScenario(scenarioId)
  const rng = makeRng(seed)
  let s = createStateFromScenario(scenario)
  while (!isTerminal(s)) {
    s = stepSimulation(s, decide(s), scenario, rng)
  }
  return computeMetrics(s, scenario.cash)
}

describe('rule agent', () => {
  it('produces finite reward on all scenarios', () => {
    for (const sc of scenarios) {
      const m = runEpisode(ruleAgentDecide, sc.id)
      expect(Number.isFinite(m.totalReward)).toBe(true)
    }
  })

  it('never results in negative cash', () => {
    for (const sc of scenarios) {
      const scenario = getScenario(sc.id)
      let s = createStateFromScenario(scenario)
      while (!isTerminal(s)) {
        s = stepSimulation(s, ruleAgentDecide(s))
        expect(s.cash).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('is deterministic across runs with same input', () => {
    const m1 = runEpisode(ruleAgentDecide, 'balanced', 42)
    const m2 = runEpisode(ruleAgentDecide, 'balanced', 42)
    expect(m1.totalReward).toBe(m2.totalReward)
    expect(m1.finalCash).toBe(m2.finalCash)
  })
})

describe('random agent', () => {
  it('produces finite reward on all scenarios', () => {
    for (const sc of scenarios) {
      const rng = makeRng(42)
      const m = runEpisode(s => randomAgentDecide(s, rng), sc.id)
      expect(Number.isFinite(m.totalReward)).toBe(true)
    }
  })

  it('never results in negative cash', () => {
    for (const sc of scenarios) {
      const scenario = getScenario(sc.id)
      const rng = makeRng(42)
      let s = createStateFromScenario(scenario)
      while (!isTerminal(s)) {
        s = stepSimulation(s, randomAgentDecide(s, rng))
        expect(s.cash).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('produces different results across seeds', () => {
    const rng1 = makeRng(1)
    const rng2 = makeRng(999)
    const m1 = runEpisode(s => randomAgentDecide(s, rng1), 'balanced')
    const m2 = runEpisode(s => randomAgentDecide(s, rng2), 'balanced')
    expect(m1.totalReward).not.toBe(m2.totalReward)
  })
})

describe('heuristic agent', () => {
  it('produces finite reward on all scenarios', () => {
    for (const sc of scenarios) {
      const m = runEpisode(heuristicAgentDecide, sc.id)
      expect(Number.isFinite(m.totalReward)).toBe(true)
    }
  })

  it('outperforms random agent on balanced scenario across 10 seeds', () => {
    let heuristicWins = 0
    for (let seed = 0; seed < 10; seed++) {
      const rng = makeRng(seed)
      const hm = runEpisode(heuristicAgentDecide, 'balanced', seed)
      const rm = runEpisode(s => randomAgentDecide(s, rng), 'balanced', seed)
      if (hm.totalReward > rm.totalReward) heuristicWins++
    }
    expect(heuristicWins).toBeGreaterThanOrEqual(7) // wins at least 7/10
  })

  it('outperforms random agent on high-penalty scenario across 10 seeds', () => {
    let wins = 0
    for (let seed = 0; seed < 10; seed++) {
      const rng = makeRng(seed)
      const hm = runEpisode(heuristicAgentDecide, 'high-penalty', seed)
      const rm = runEpisode(s => randomAgentDecide(s, rng), 'high-penalty', seed)
      if (hm.totalReward > rm.totalReward) wins++
    }
    expect(wins).toBeGreaterThanOrEqual(7)
  })
})

describe('rule agent vs random agent', () => {
  it('rule beats random on balanced scenario across 10 seeds', () => {
    let wins = 0
    for (let seed = 0; seed < 10; seed++) {
      const rng = makeRng(seed)
      const rm = runEpisode(s => randomAgentDecide(s, rng), 'balanced', seed)
      const rule = runEpisode(ruleAgentDecide, 'balanced', seed)
      if (rule.totalReward > rm.totalReward) wins++
    }
    expect(wins).toBeGreaterThanOrEqual(7)
  })
})

describe('Q-table agent', () => {
  it('produces finite reward after training', () => {
    const scenario = getScenario('balanced')
    const agent = new QAgent(scenario.cash)
    agent.resetEpsilon()

    for (let ep = 0; ep < 100; ep++) {
      let s = createStateFromScenario(scenario)
      while (!isTerminal(s)) {
        const prevLog = s.log.length
        const actions = agent.decide(s)
        s = stepSimulation(s, actions)
        const newEntries = s.log.slice(prevLog)
        for (const entry of newEntries) {
          const inv = s.invoices.find(i => i.vendor === entry.vendor)
          if (inv) agent.update(inv.id, parseFloat(entry.reward), s)
        }
        agent.decayEpsilon()
      }
    }

    const m = runEpisode(s => agent.decide(s), 'balanced')
    expect(Number.isFinite(m.totalReward)).toBe(true)
  })

  it('epsilon decays toward minimum', () => {
    const agent = new QAgent(10000)
    agent.resetEpsilon()
    for (let i = 0; i < 500; i++) agent.decayEpsilon()
    expect(agent.getEpsilon()).toBeLessThan(0.2)
    expect(agent.getEpsilon()).toBeGreaterThanOrEqual(0.05)
  })

  it('never results in negative cash', () => {
    const scenario = getScenario('tight-cash')
    const agent = new QAgent(scenario.cash)
    let s = createStateFromScenario(scenario)
    while (!isTerminal(s)) {
      s = stepSimulation(s, agent.decide(s))
      expect(s.cash).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('edge cases', () => {
  it('handles empty invoice list gracefully', () => {
    const emptyScenario = { id: 'empty', label: 'Empty', description: '', cash: 5000, invoices: [] }
    const s = createStateFromScenario(emptyScenario)
    expect(ruleAgentDecide(s)).toHaveLength(0)
    expect(heuristicAgentDecide(s)).toHaveLength(0)
    expect(randomAgentDecide(s, makeRng(1))).toHaveLength(0)
  })

  it('handles zero cash — all actions forced to delay', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    s = { ...s, cash: 0 }
    const next = stepSimulation(s, s.invoices.map(i => ({ invoiceId: i.id, type: 'full' as const })))
    expect(next.cash).toBeGreaterThanOrEqual(0)
    expect(next.invoices.every(i => !i.paid)).toBe(true)
  })

  it('handles invoice amount already at zero', () => {
    const scenario = getScenario('balanced')
    let s = createStateFromScenario(scenario)
    s.invoices[0]!.amount = 0
    const actions = [{ invoiceId: s.invoices[0]!.id, type: 'partial' as const, amount: 0 }]
    const next = stepSimulation(s, actions)
    expect(next.cash).toBeGreaterThanOrEqual(0)
  })

  it('stochastic extremes never break reward or cash', () => {
    const scenario = getScenario('stochastic')
    for (let seed = 0; seed < 20; seed++) {
      const rng = makeRng(seed * 7)
      let s = createStateFromScenario(scenario)
      while (!isTerminal(s)) {
        s = stepSimulation(s, ruleAgentDecide(s), scenario, rng)
        expect(Number.isFinite(s.totalReward)).toBe(true)
        expect(s.cash).toBeGreaterThanOrEqual(0)
      }
    }
  })
})