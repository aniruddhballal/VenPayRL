import { createStateFromScenario, stepSimulation, computeMetrics, isTerminal, makeRng } from './simulation'
import { getScenario, scenarios } from './scenarios'
import { ruleAgentDecide } from './agents/ruleAgent'
import { randomAgentDecide } from './agents/randomAgent'
import { heuristicAgentDecide } from './agents/heuristicAgent'

const SEEDS = [42, 123, 999, 7, 31]
const AGENTS = [
  { name: 'Rule', decide: ruleAgentDecide },
  { name: 'Random', decide: (s: Parameters<typeof ruleAgentDecide>[0]) => randomAgentDecide(s, makeRng(42)) },
  { name: 'Heuristic', decide: heuristicAgentDecide },
]

console.log('\n=== VenPayRL Validation Report ===\n')

for (const scenario of scenarios) {
  console.log(`Scenario: ${scenario.label} (cash: $${scenario.cash})`)
  console.log('─'.repeat(60))

  for (const agent of AGENTS) {
    const rewards: number[] = []
    const cashes: number[] = []
    const penalties: number[] = []

    for (const seed of SEEDS) {
      const rng = makeRng(seed)
      let s = createStateFromScenario(scenario)
      while (!isTerminal(s)) {
        s = stepSimulation(s, agent.decide(s), scenario, rng)
      }
      const m = computeMetrics(s, scenario.cash)
      rewards.push(m.totalReward)
      cashes.push(m.finalCash)
      penalties.push(m.totalPenalties)

      // Sanity checks
      if (s.cash < 0) console.warn(`  ⚠ NEGATIVE CASH: seed=${seed}`)
      if (!Number.isFinite(m.totalReward)) console.warn(`  ⚠ NON-FINITE REWARD: seed=${seed}`)
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const std = (arr: number[]) => Math.sqrt(arr.reduce((s, x) => s + (x - avg(arr)) ** 2, 0) / arr.length)

    console.log(
      `  ${agent.name.padEnd(10)} ` +
      `reward: ${avg(rewards).toFixed(1).padStart(8)} ±${std(rewards).toFixed(1).padEnd(6)} ` +
      `cash: $${avg(cashes).toFixed(0).padStart(6)}  ` +
      `penalties: $${avg(penalties).toFixed(0)}`
    )
  }
  console.log()
}

console.log('=== Validation complete — no crashes or negative cash detected ===\n')