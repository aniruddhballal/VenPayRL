import { createStateFromScenario, stepSimulation, computeMetrics, isTerminal, makeRng } from './simulation'
import { getScenario, scenarios } from './scenarios'
import { ruleAgentDecide }      from './agents/ruleAgent'
import { randomAgentDecide }    from './agents/randomAgent'
import { heuristicAgentDecide } from './agents/heuristicAgent'
import type { SimState, AgentAction } from './types'

const SEEDS   = [42, 123, 999, 7, 31]
const AGENTS  = [
  { name: 'Rule',      decide: ruleAgentDecide },
  { name: 'Random',    decide: (s: SimState) => randomAgentDecide(s, makeRng(42)) },
  { name: 'Heuristic', decide: heuristicAgentDecide },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function pad(str: string, len: number) { return str.padEnd(len) }
function currency(n: number) { return `$${n.toFixed(0).padStart(7)}` }

function actionLabel(type: string) {
  if (type === 'full')    return '✅ FULL   '
  if (type === 'partial') return '⚡ PARTIAL'
  if (type === 'delay')   return '⏳ DELAY  '
  return '❌ OVERDUE'
}

// ─── Summary Report ─────────────────────────────────────────────────────────

function runSummary() {
  console.log('\n' + '═'.repeat(70))
  console.log('  VenPayRL — Agent Summary Report')
  console.log('═'.repeat(70))

  for (const scenario of scenarios) {
    console.log(`\nScenario: ${scenario.label} (cash: $${scenario.cash})`)
    console.log('─'.repeat(70))

    for (const agent of AGENTS) {
      const rewards: number[] = []
      const cashes:  number[] = []
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

        if (s.cash < 0)
          console.warn(`  ⚠ NEGATIVE CASH: agent=${agent.name} seed=${seed}`)
        if (!Number.isFinite(m.totalReward))
          console.warn(`  ⚠ NON-FINITE REWARD: agent=${agent.name} seed=${seed}`)
      }

      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
      const std = (arr: number[]) =>
        Math.sqrt(arr.reduce((s, x) => s + (x - avg(arr)) ** 2, 0) / arr.length)

      const winner = avg(rewards) > 0 ? ' 🏆' : ''
      console.log(
        `  ${pad(agent.name, 10)}` +
        `reward: ${avg(rewards).toFixed(1).padStart(10)} ±${std(rewards).toFixed(1).padEnd(8)}` +
        `cash: ${currency(avg(cashes))}  ` +
        `penalties: ${currency(avg(penalties))}${winner}`
      )
    }
  }
}

// ─── Per-Day Trace ───────────────────────────────────────────────────────────

function traceAgent(agentName: string, decide: (s: SimState) => AgentAction[], scenarioId: string, seed = 42) {
  const scenario = getScenario(scenarioId)
  const rng      = makeRng(seed)
  let s          = createStateFromScenario(scenario)

  console.log('\n' + '═'.repeat(70))
  console.log(`  Trace: ${agentName} | Scenario: ${scenario.label} | Seed: ${seed}`)
  console.log('═'.repeat(70))
  console.log(`  Starting cash: $${scenario.cash}`)
  console.log(`  Invoices:`)
  for (const inv of s.invoices) {
    console.log(`    ${pad(inv.vendor, 14)} $${inv.amount} due day ${inv.dueDate} penalty ${(inv.penaltyRate * 100).toFixed(0)}%/day`)
  }
  console.log('')

  while (!isTerminal(s)) {
    const actions  = decide(s)
    const prevCash = s.cash
    s = stepSimulation(s, actions, scenario, rng)

    // only print days where something interesting happened
    const hasAction = s.log.filter(l => l.day === s.day).length > 0
    if (!hasAction && s.day % 5 !== 0) continue

    console.log(`  Day ${String(s.day).padStart(2)} | Cash: ${currency(s.cash)} (${prevCash >= s.cash ? '-' : '+'}${currency(Math.abs(s.cash - prevCash)).trim()})`)

    const dayLog = s.log.filter(l => l.day === s.day)
    for (const entry of dayLog) {
      const reward = parseFloat(entry.reward)
      const rewardStr = (reward >= 0 ? '+' : '') + reward.toFixed(1)
      console.log(
        `    ${actionLabel(entry.action.toLowerCase().replace('_pay', '').replace('ull', 'full'))} ` +
        `${pad(entry.vendor, 14)} ` +
        `$${parseFloat(entry.amount).toFixed(0).padStart(6)}  ` +
        `reward: ${rewardStr.padStart(8)}`
      )
    }

    // print unpaid invoice status every 5 days
    if (s.day % 5 === 0) {
      const unpaid = s.invoices.filter(i => !i.paid)
      if (unpaid.length > 0) {
        console.log(`    Unpaid: ${unpaid.map(i => `${i.vendor}($${i.amount.toFixed(0)}, delayed ${i.delayed}d)`).join(', ')}`)
      }
    }
  }

  const m = computeMetrics(s, scenario.cash)
  console.log('')
  console.log(`  ── Final Results ──`)
  console.log(`  Total Reward:    ${m.totalReward.toFixed(1)}`)
  console.log(`  Final Cash:      $${m.finalCash.toFixed(0)}`)
  console.log(`  Cash Delta:      ${m.cashDelta >= 0 ? '+' : ''}$${m.cashDelta.toFixed(0)}`)
  console.log(`  Penalties Paid:  $${m.totalPenalties.toFixed(0)}`)
  console.log(`  Invoices Paid:   ${m.invoicesPaid}/${s.invoices.length}`)
  if (m.invoicesUnpaid > 0) {
    console.log(`  ⚠ UNPAID:       ${s.invoices.filter(i => !i.paid).map(i => i.vendor).join(', ')}`)
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

// npm run passes args after -- as positional: tsx src/validate.ts trace rule balanced 42
// direct tsx invocation: tsx src/validate.ts --trace --agent rule --scenario balanced --seed 42
// support both styles

const raw = process.argv.slice(2)

function getArg(flags: string[], fallback: string): string {
  // named style: --agent rule
  for (const flag of flags) {
    const idx = raw.indexOf(flag)
    if (idx !== -1 && raw[idx + 1]) return raw[idx + 1]!
  }
  return fallback
}

// detect trace mode: either --trace flag or first positional arg is 'trace'
const isTrace = raw.includes('--trace') || raw[0] === 'trace'

if (isTrace) {
  // positional style: tsx validate.ts trace [agent] [scenario] [seed]
  // named style:      tsx validate.ts --trace --agent rule --scenario balanced --seed 42
  const scenarioId = getArg(['--scenario'], raw[2] ?? 'balanced')
  const agentName  = getArg(['--agent'],    raw[1] ?? 'all')
  const seed       = Number(getArg(['--seed'], raw[3] ?? '42'))

  const agentsToTrace = agentName === 'all'
    ? AGENTS
    : AGENTS.filter(a => a.name.toLowerCase() === agentName.toLowerCase())

  if (agentsToTrace.length === 0) {
    console.log(`Unknown agent "${agentName}". Valid: rule, random, heuristic, all`)
    process.exit(1)
  }

  for (const agent of agentsToTrace) {
    traceAgent(agent.name, agent.decide, scenarioId, seed)
  }
} else {
  runSummary()
  console.log('\n' + '═'.repeat(70))
  console.log('  Validation complete')
  console.log('')
  console.log('  Trace mode usage:')
  console.log('    npm run validate trace                        (all agents, balanced)')
  console.log('    npm run validate trace rule                   (rule agent, balanced)')
  console.log('    npm run validate trace rule balanced          (rule, balanced)')
  console.log('    npm run validate trace rule balanced 42       (rule, balanced, seed 42)')
  console.log('    npm run validate trace heuristic tight-cash   (heuristic, tight-cash)')
  console.log('═'.repeat(70) + '\n')
}