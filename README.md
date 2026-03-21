# VenPayRL

A vendor payment reinforcement learning simulator built with TypeScript, React, and Express. The environment models a company managing cash reserves against a set of vendor invoices — each carrying a due date, penalty rate, and amount — and evaluates how different agents (rule-based, random, heuristic, Q-learning, and DQN) learn to pay invoices at the right time to maximise a reward signal.

---

## What It Does

A company starts each episode with a cash balance and a set of vendor invoices. Time advances step by step. At each step, an agent observes the current state and decides what to do with each unpaid invoice:

- **Pay in full** — clears the invoice, rewards timely payment
- **Pay partially** — reduces the balance, small penalty applied
- **Delay** — accrues a daily penalty based on the invoice's penalty rate

The simulation enforces hard constraints — no negative cash, no overpaying — and computes a reward signal each step that rewards timely payment and cash conservation, and penalises delays and overdue invoices. An episode ends when all invoices are paid or a day limit (60) is reached.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS v4 |
| Backend | Express + TypeScript (tsx, CommonJS) |
| Charts | Recharts |
| RL (tabular) | Custom Q-table (in-memory) |
| RL (neural) | TensorFlow.js (`@tensorflow/tfjs`) |
| Testing | Vitest |

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
│   │   ├── routes.ts              Express API routes
│   │   ├── validate.ts            Ad-hoc manual validation script
│   │   └── agents/
│   │       ├── ruleAgent.ts       Urgency + penalty ratio agent
│   │       ├── randomAgent.ts     Random baseline agent
│   │       ├── heuristicAgent.ts  Penalty ÷ deadline urgency score agent
│   │       ├── qAgent.ts          Q-table agent with epsilon-greedy decay
│   │       └── dqnAgent.ts        DQN agent with experience replay
│   └── tests/
│       ├── simulation.test.ts     22 tests — state, constraints, stochastic
│       ├── metrics.test.ts        15 tests — reward, export, cashDelta, JSON/CSV
│       └── agents.test.ts         19 tests — all agents, edge cases
└── frontend/
    └── src/
        ├── App.tsx                Orchestration only
        ├── api.ts                 Axios API calls with error interceptor
        ├── types.ts               Shared frontend types
        ├── hooks/
        │   └── useSimulation.ts   All state, streaming, and simulation logic
        └── components/
            ├── Header.tsx
            ├── Controls.tsx
            ├── InvoiceTable.tsx
            ├── Charts.tsx
            ├── ActionLog.tsx
            ├── ActionHeatmap.tsx
            ├── AgentSelector.tsx
            ├── ScenarioSelector.tsx
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
| GET | `/api/scenarios` | All available scenarios |
| POST | `/api/reset` | Reset sim (`scenarioId`, `seed`) |
| POST | `/api/agent-step` | Advance one step (`agentType`) |
| GET | `/api/run-episodes-stream` | SSE stream — live episode training updates |
| POST | `/api/run-experiment` | Full benchmark — all agents × all scenarios |
| POST | `/api/q-config` | Update Q-agent hyperparameters |
| POST | `/api/dqn-config` | Update DQN hyperparameters |
| POST | `/api/hyperparameter-sweep` | Batch runs over param grid |
| GET | `/api/health-check` | One episode per agent on balanced/seed 42 |

---

## Agents

### Rule-based
Sorts unpaid invoices by days until due and pays the most urgent ones when urgency ≤ 5 days or the penalty ratio (`penaltyRate / daysUntilDue`) exceeds a threshold. Deterministic and stable.

### Random
Randomly selects full pay, partial pay, or delay for each invoice each step using a seeded RNG. Serves as the untrained baseline — any structured agent should beat this on constrained scenarios.

### Heuristic
Combines penalty rate and deadline proximity into a single urgency score (`penaltyRate / max(daysUntilDue, 1)`). Pays in full above score threshold, partial above a lower threshold, otherwise delays. Consistently outperforms random on tight-cash and high-penalty scenarios.

### Q-Table Agent
Learns a payment policy over episodes using Q-learning with epsilon-greedy exploration. State space:

- **Cash buckets** (5 levels)
- **Urgency buckets** (4 levels: overdue / urgent / upcoming / safe)
- **Overdue count buckets** (3 levels: 0 / 1 / 2+)

Total: 60 states × 3 actions per invoice.

| Parameter | Default |
|---|---|
| Learning rate (α) | 0.1 |
| Discount factor (γ) | 0.95 |
| Epsilon decay | 0.995 |
| Epsilon min | 0.05 |

### DQN Agent
Two-layer neural network (64→64→3) using TensorFlow.js. Features experience replay buffer and target network that syncs every 100 steps. State vector per invoice: `[cashRatio, daysUntilDue (norm), penaltyRate, delayed (norm), overdueCount (norm)]`.

| Parameter | Default |
|---|---|
| Learning rate | 0.001 |
| Discount (γ) | 0.95 |
| Epsilon decay | 0.995 |
| Epsilon min | 0.05 |
| Batch size | 32 |
| Memory size | 2000 |

---

## Scenarios

| Scenario | Cash | Invoices | Notes |
|---|---|---|---|
| Balanced | $10,000 | 5 | Standard baseline |
| Tight Cash | $4,000 | 4 | Cash scarce relative to invoices |
| High Penalty | $12,000 | 5 | Penalty rates 12–25%, timing critical |
| Many Invoices | $15,000 | 8 | High concurrency |
| Stochastic | $8,000 | 4 | ±20% fee variance + $200/day inflow |

All scenarios support a configurable seed for fully reproducible runs.

---

## Reward Function

```
step_reward =
  + (15 - delayed_days × 2)    on FULL_PAY      (rewards on-time payment strongly)
  - 2                           on PARTIAL_PAY
  - (amount × penaltyRate)      on DELAY
  - (amount × penaltyRate × 2)  on OVERDUE (auto-triggered)
  + (cash × 0.0001)             each step        (small conservation bonus, avoids hoarding bias)
```

The cash conservation bonus is deliberately small to prevent agents that hoard cash from competing with structured agents on reward alone.

---

## Live Training Stream

Training runs use Server-Sent Events (SSE) — the episode chart and DQN panel update in real time as each preview batch arrives. A `TrainingProgress` bar shows current episode and percentage. The stream is cancelled cleanly on reset or when a new training run starts.

---

## Benchmark & Stability

The **Run Experiment** button benchmarks all five agents across all five scenarios. For each agent-scenario pair it:

1. Trains Q-table and DQN agents fresh for N episodes
2. Freezes epsilon to 0 for evaluation (no exploration noise)
3. Evaluates across K seeds (default 10)
4. Reports average reward ± standard deviation, average final cash, average penalties

Winner per scenario is determined by highest average reward. Results exportable as CSV or JSON.

---

## Health Check

The **Run Health Check** button runs one episode per agent on the balanced scenario with seed 42 and returns a pass/fail table. Use this before any demo to verify the simulation and all agents are functioning correctly.

---

## Hyperparameter Sweep

Define a grid of 1–2 parameters with comma-separated values, choose episode count and seed count per combination, and run. Results are ranked by average reward with a bar chart. Works for both Q-table and DQN agents.

---

## Testing

```bash
cd backend
npm test
```

56 tests across three files:

| File | Tests | Covers |
|---|---|---|
| `simulation.test.ts` | 22 | State creation, step constraints, stochastic, terminal |
| `metrics.test.ts` | 15 | Reward, cashDelta, CSV/JSON export, no-NaN, structure |
| `agents.test.ts` | 19 | All agents, edge cases (zero cash, empty invoices, stochastic extremes) |

For quick manual validation:
```bash
npm run validate
```

Prints avg reward, cash, and penalties for rule/random/heuristic across all scenarios and 5 seeds.

---

## Where We Started

A single-file simulation with one rule-based agent, no learning, no scenarios, and a basic UI showing invoices and an action log.

---

## Where We Are Now

- 5 agents: rule-based, random, heuristic, Q-table, DQN
- 5 scenarios including a stochastic environment
- Seeded RNG for full reproducibility
- Hard constraints: no negative cash, no overpaying
- SSE streaming training — live reward preview updating every N episodes
- Episode training up to 2000 episodes with real-time chart updates
- DQN dedicated panel: reward, loss curve, epsilon decay, hyperparameter sliders
- Full benchmark suite: all agents × all scenarios × configurable seeds
- Avg reward ± std deviation per agent-scenario pair
- Health check endpoint and UI panel — one-click pre-demo sanity check
- Hyperparameter sweep with ranked bar chart results
- Action heatmap: colour-coded per-invoice decisions across all days
- Scenario comparison dashboard: grouped bar chart across all agents
- Metrics panel with hover tooltips explaining each metric
- Axis labels on all charts
- Agent colour dot legend in benchmark table
- CSV and JSON export for episodes and benchmark results
- 56 Vitest tests + validate.ts for ad-hoc checks
- Modular codebase: isolated components, custom hook, agent directory
- Bug fixes: DQN tensor memory leak, epsilon freeze post-training, reward calibration, agent urgency thresholds, private field hacks replaced with proper methods, unused initialCash parameter now computes cashDelta

---

## Known Issues / Next Steps

- DQN training in run-experiment is still synchronous — candidate for worker threads on very large episode counts
- No persistent Q-table or DQN weights across sessions — training resets on server restart
- No curriculum learning — agents always start from the same scenario difficulty

---

## Docs

- [`AGENTS.md`](./AGENTS.md) — decision logic, state space, tuning guide per agent
- [`METRICS.md`](./METRICS.md) — reward function breakdown, benchmark metrics, scenario configs