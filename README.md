# VenPayRL

A vendor payment reinforcement learning simulator built with TypeScript, React, and Express. The environment models a company managing cash reserves against a set of vendor invoices — each carrying a due date, penalty rate, and amount — and evaluates how different agents (rule-based, random, heuristic, Q-learning, and DQN) learn to pay invoices at the right time to maximise a reward signal.

---

## What It Does

A company starts each episode with a cash balance and a set of vendor invoices. Time advances step by step. At each step, an agent observes the current state and decides what to do with each unpaid invoice:

- **Pay in full** — clears the invoice, rewards timely payment
- **Pay partially** — reduces the balance, small penalty applied
- **Delay** — accrues a daily penalty based on the invoice's penalty rate

The simulation enforces hard constraints — no negative cash, no overpaying, sub-dollar remainder clearing — and computes a reward signal each step that rewards timely payment and penalises delays. An episode ends when all invoices are paid or a day limit (60) is reached.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS v4 |
| Backend | Express + TypeScript (tsx, CommonJS) |
| Charts | Recharts |
| RL (tabular) | Custom Q-table (in-memory) |
| RL (neural) | TensorFlow.js (`@tensorflow/tfjs`) |
| Icons | Lucide React |
| Testing | Vitest (51 tests) |

---

## Project Structure

```
VenPayRL/
├── backend/
│   ├── src/
│   │   ├── index.ts               Entry point
│   │   ├── types.ts               Shared interfaces
│   │   ├── simulation.ts          Core step engine, seeded RNG, metrics
│   │   ├── scenarios.ts           5 preset scenarios
│   │   ├── routes.ts              Express API + SSE streaming
│   │   ├── validate.ts            Ad-hoc manual validation script
│   │   └── agents/
│   │       ├── ruleAgent.ts       Three-pass payment strategy
│   │       ├── randomAgent.ts     Random baseline (uniform distribution)
│   │       ├── heuristicAgent.ts  Urgency score + three-pass partials
│   │       ├── qAgent.ts          Q-table with amount-bucket state space
│   │       └── dqnAgent.ts        DQN with amountRatio state feature
│   └── tests/
│       ├── simulation.test.ts     22 tests
│       ├── metrics.test.ts        15 tests
│       └── agents.test.ts         19 tests
└── frontend/
    └── src/
        ├── App.tsx                Mode state + layout
        ├── api.ts                 Axios calls + SSE stream client
        ├── types.ts               Shared frontend types
        ├── hooks/
        │   └── useSimulation.ts   All state, streaming, simulation logic
        └── components/
            ├── Header.tsx         Logo + Simulate/Analyse tabs + live stats
            ├── Sidebar.tsx        Global context — scenario, agent, metrics
            ├── SimulateView.tsx   Simulate mode workspace
            ├── AnalyseView.tsx    Analyse mode workspace
            ├── Controls.tsx
            ├── InvoiceTable.tsx
            ├── Charts.tsx
            ├── ActionLog.tsx
            ├── ActionHeatmap.tsx
            ├── AgentSelector.tsx
            ├── ScenarioSelector.tsx
            ├── CustomScenarioDrawer.tsx
            ├── MetricsPanel.tsx
            ├── EpisodeChart.tsx
            ├── DQNPanel.tsx
            ├── BenchmarkTable.tsx
            ├── ScenarioDashboard.tsx
            ├── QConfigPanel.tsx
            ├── HyperparamSweep.tsx
            ├── ExportButton.tsx
            ├── HealthCheck.tsx
            ├── TrainingProgress.tsx
            ├── AllPaidBanner.tsx
            └── LoadingScreen.tsx
```

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/VenPayRL.git
cd VenPayRL

# Backend
cd backend
npm install
npm run dev       # runs on http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev       # runs on http://localhost:5173

# Tests
cd backend
npm test

# Manual validation
npm run validate
```

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/state` | Current simulation state |
| GET | `/api/scenarios` | All available scenarios including custom |
| POST | `/api/reset` | Reset sim (`scenarioId`, `seed`) |
| POST | `/api/agent-step` | Advance one step (`agentType`) |
| GET | `/api/run-episodes-stream` | SSE stream — live episode training updates |
| POST | `/api/run-experiment` | Full benchmark — all agents × all scenarios |
| POST | `/api/q-config` | Update Q-agent hyperparameters |
| POST | `/api/dqn-config` | Update DQN hyperparameters |
| POST | `/api/hyperparameter-sweep` | Batch runs over param grid |
| GET | `/api/health-check` | One episode per agent on balanced/seed 42 |
| POST | `/api/custom-scenario` | Create dynamic scenario from real invoice data |

---

## Agents

### Rule-based
Three-pass payment strategy sorted by days until due (most urgent first):

1. **Pass 1** — pay in full using original invoice amount (not compounded cost) as the affordability threshold. Pays earlier by ignoring accumulated penalty in the cost check.
2. **Pass 2** — second sweep catches any cheaper invoices that were skipped in pass 1 due to sort order.
3. **Pass 3** — partial payments on remaining unpaid invoices sorted by daily penalty cost descending (`penaltyRate × amount`). Allocates 50% of remaining cash per invoice, chipping away at the most expensive invoices simultaneously rather than sequentially.

Result: pays high-penalty invoices in parallel via partials while waiting for inflow to accumulate, dramatically reducing total penalties in cash-constrained scenarios.

### Random
Uniformly random action selection (full / partial / delay) per invoice using seeded RNG. Serves as the untrained baseline floor — every structured agent should clearly beat this on constrained scenarios. Intentionally kept naive.

### Heuristic
Same three-pass strategy as rule agent, but sorts by urgency score (`penaltyRate / max(daysUntilDue, 0.5)`) instead of raw days until due. Prioritises invoices with the highest penalty rate relative to remaining time. Matches rule agent on all scenarios including stochastic.

### Q-Table Agent
Tabular Q-learning with epsilon-greedy exploration. Expanded state space:

- **Cash buckets** (5): ratio of current cash to max cash
- **Urgency buckets** (4): overdue / urgent ≤2d / upcoming ≤5d / safe
- **Overdue count buckets** (3): 0 / 1 / 2+
- **Amount buckets** (3): mostly unpaid >75% / partially paid 25–75% / nearly cleared <25%

Total: **180 states × 3 actions** per invoice. The amount bucket allows the agent to learn different behaviour for invoices that are already partially paid down.

| Parameter | Default |
|---|---|
| Learning rate (α) | 0.1 |
| Discount factor (γ) | 0.95 |
| Epsilon decay | 0.995 |
| Epsilon min | 0.05 |

### DQN Agent
Two-layer neural network (64→64→3) using TensorFlow.js. Experience replay buffer and target network syncing every 100 steps. Expanded state vector per invoice:

```
[cashRatio, daysUntilDue (norm), penaltyRate, delayed (norm), overdueCount (norm), amountRatio]
```

The `amountRatio` feature (remaining amount / original amount) gives the network visibility into partial payment progress — it can learn to keep chipping away at an invoice it has already partially paid rather than treating it as a fresh decision each step.

| Parameter | Default |
|---|---|
| Learning rate | 0.001 |
| Discount (γ) | 0.95 |
| Epsilon decay | 0.995 |
| Epsilon min | 0.05 |
| Batch size | 32 |
| Memory size | 2000 |

---

## Reward Function

```
step_reward =
  + (15 - delayed_days × 2)    on FULL_PAY      (rewards on-time payment)
  - 2                           on PARTIAL_PAY   (small cost for not settling)
  - (amount × penaltyRate)      on DELAY         (daily compounding cost)
  - (amount × penaltyRate × 2)  on OVERDUE       (auto-triggered double penalty)
  + (cash × 0.0001)             each step        (tiny conservation bonus)
```

Maximising the reward signal means finding the sequence of actions that produces the highest cumulative sum. In practice this means: pay high-penalty invoices as early as possible, use partials only when cash-constrained, delay only low-penalty far-future invoices. Reduced penalties and increased rewards are strongly correlated but not identical — the full payment bonus and partial payment cost also contribute.

---

## Scenarios

| Scenario | Cash | Invoices | Notes |
|---|---|---|---|
| Balanced | $12,000 | 5 | Standard baseline — cash covers all invoices |
| Tight Cash | $4,000 | 4 | Cash scarce relative to total invoice value |
| High Penalty | $12,000 | 5 | Penalty rates 12–25%, timing critical |
| Many Invoices | $15,000 | 8 | High vendor concurrency |
| Stochastic | $8,000 | 4 | ±20% fee variance + $200/day cash inflow |
| **Custom** | user-defined | unlimited | Enter your own vendors, amounts, due dates, penalty rates, and daily cash inflow |

---

## Custom Scenario Builder

Click **Custom scenario** in the scenario selector to open the drawer. Pre-filled with a realistic test case (5 vendors, $15,000 cash, $800/day inflow) that you can edit or clear entirely.

**Fields per invoice:** vendor name, amount ($), due date (days from today), penalty rate (%).

**Daily cash inflow** — optional field that adds a fixed amount to cash each day before the agent acts. Models real revenue streams, making cash-constrained scenarios solvable through intelligent payment sequencing. Without inflow, tight-cash scenarios simply accumulate penalties with no resolution path.

The custom scenario lives in session memory only — it resets on page refresh. On apply it is injected into the active scenario list and auto-selected.

**Test values:**

| Vendor | Amount | Due | Penalty |
|---|---|---|---|
| Rent Corp | $8,000 | 3 days | 12% |
| Tech Supplies | $5,000 | 7 days | 5% |
| Logistics Co | $3,500 | 10 days | 8% |
| Software Ltd | $6,000 | 14 days | 4% |
| Office Goods | $2,000 | 18 days | 6% |

Starting cash $15,000 · $800/day inflow · Total invoiced $24,500

---

## UI Layout

Two-mode design with a persistent global sidebar:

**Sidebar (always visible)**
- Getting started step indicator with animated pulse on active step
- Scenario selector with seed control and custom scenario button
- Agent selector with epsilon and loss readout for learning agents
- Live metrics panel (reward, cash, delta, penalties, invoices, day) with hover tooltips

**Simulate mode**
- Problem context card — one-paragraph explanation + 3/5/5 stat summary
- Run controls (reset, step, auto run, speed slider)
- Invoice table + cash/reward charts side by side
- Action heatmap — appears after first step, colour-coded per-invoice decisions
- Action log — appears after first step, semantic colour per action type

**Analyse mode**
- Q/DQN configuration panel (learning rate, gamma, epsilon sliders)
- Episode training chart with convergence annotation and click-to-inspect popover
- Full benchmark + scenario comparison dashboard
- Hyperparameter sweep with ranked results bar chart
- Health check panel
- CSV and JSON export

---

## Live Training Stream

Training runs use Server-Sent Events (SSE) — the episode chart updates in real time as each preview batch arrives. A progress bar shows current episode and percentage. The stream cancels cleanly on reset or when a new training run starts.

---

## Benchmark & Stability

The **Run Experiment** button benchmarks all five agents across all five scenarios. For each agent-scenario pair it:

1. Trains Q-table and DQN agents fresh for N episodes
2. Freezes epsilon to 0 for evaluation (no exploration noise)
3. Evaluates across K seeds (default 10)
4. Reports average reward ± standard deviation, average final cash, average penalties

Winner per scenario is determined by highest average reward. Results exportable as CSV or JSON.

---

## Validated Agent Ordering

```
Scenario: Balanced       — Rule ≈ Heuristic >> Random
Scenario: Tight Cash     — Rule ≈ Heuristic >> Random
Scenario: High Penalty   — Rule ≈ Heuristic >> Random  (zero penalties)
Scenario: Many Invoices  — Rule ≈ Heuristic >> Random  (zero penalties)
Scenario: Stochastic     — Rule ≈ Heuristic >> Random  (both +31, zero penalties)
```

Rule and Heuristic now match on all five scenarios including stochastic, where heuristic previously scored -7.6. Both use the three-pass partial payment strategy.

---

## Health Check

The **Run Health Check** button runs one episode per agent on the balanced scenario with seed 42 and returns a pass/fail table. Use this before any demo to verify the simulation and all agents are functioning correctly.

---

## Hyperparameter Sweep

Define a grid of 1–2 parameters with comma-separated values, choose episode count and seed count per combination, and run. Results are ranked by average reward with a bar chart. Works for both Q-table and DQN agents.

---

## Testing

```bash
cd backend && npm test
```

| File | Tests | Covers |
|---|---|---|
| `simulation.test.ts` | 22 | State creation, step constraints, stochastic, terminal |
| `metrics.test.ts` | 15 | Reward, cashDelta, CSV/JSON export, no-NaN, structure |
| `agents.test.ts` | 19 | All agents, edge cases (zero cash, empty invoices, stochastic extremes) |

Manual validation with per-day trace:

```bash
npm run validate                              # summary across all scenarios
npm run validate trace rule balanced 42       # rule agent, balanced, seed 42
npm run validate trace heuristic tight-cash   # heuristic on tight-cash
npm run validate trace all high-penalty       # all agents on high-penalty
```

---

## Where We Started

A single-file simulation with one rule-based agent, no learning, no scenarios, and a basic UI showing invoices and an action log.

---

## Where We Are Now

- 5 agents: rule-based, random, heuristic, Q-table, DQN
- 5 hardcoded scenarios + unlimited custom scenarios with daily inflow
- Custom scenario builder — drawer UI, pre-filled test values, session memory
- Seeded RNG for full reproducibility
- Hard constraints: no negative cash, no overpaying, sub-dollar remainder clearing
- Three-pass payment strategy on rule and heuristic agents — parallel partial payments reduce penalties 92% on cash-constrained scenarios
- Q-table expanded to 180 states with amount bucket tracking partial payment progress
- DQN expanded to 6-dimensional state vector with amountRatio feature
- SSE streaming training — live reward preview updating every N episodes
- Episode training chart with convergence annotation and click-to-inspect episode popover
- Full benchmark suite: all agents × all scenarios × configurable seeds
- Avg reward ± std deviation per agent-scenario pair
- Health check endpoint and UI panel — one-click pre-demo sanity check
- Hyperparameter sweep with ranked bar chart results
- Action heatmap: colour-coded per-invoice decisions across all days
- Scenario comparison dashboard: grouped bar chart across all agents
- Metrics panel with hover tooltips
- Two-mode layout (Simulate / Analyse) with global sidebar
- Wealthsimple/Mercury/Stripe aesthetic: warm cream #F5F3EF, DM Serif Display, Inter, Lucide icons
- Routes track currentScenario object so cash inflow fires correctly on custom scenarios
- 51 Vitest tests + validate.ts with per-day trace mode

---

## Known Issues / Next Steps

- DQN training blocks the Express thread on long runs — candidate for worker threads
- No persistent Q-table or DQN weights across server restarts
- Switching agents does not auto-reset the simulation
- Custom scenario not available in validate.ts trace mode (session-only, not in static scenarios file)

---

## Docs

- [`AGENTS.md`](./AGENTS.md) — decision logic, state space, tuning guide per agent
- [`METRICS.md`](./METRICS.md) — reward function breakdown, benchmark metrics, scenario configs