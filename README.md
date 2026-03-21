# VenPayRL

A vendor payment reinforcement learning simulator built with TypeScript, React, and Express. The environment models a company managing cash reserves against a set of vendor invoices — each carrying a due date, penalty rate, and amount — and evaluates how different agents (rule-based, random, heuristic, and Q-learning) learn to pay invoices at the right time to maximise a reward signal.

---

## What It Does

A company starts each episode with a cash balance and a set of vendor invoices. Time advances step by step. At each step, an agent observes the current state and decides what to do with each unpaid invoice:

- **Pay in full** — clears the invoice, rewards timely payment
- **Pay partially** — reduces the balance, small penalty applied
- **Delay** — accrues a daily penalty based on the invoice's penalty rate

The simulation enforces hard constraints — no negative cash, no overpaying — and computes a reward signal each step that rewards timely payment and cash conservation, and penalises delays and overdue invoices. An episode ends when all invoices are paid or a day limit is reached.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS v4 |
| Backend | Express + TypeScript (tsx, CommonJS) |
| Charts | Recharts |
| Agent | Custom Q-table (in-memory, no external RL library) |

---

## Project Structure

```
VenPayRL/
├── backend/
│   └── src/
│       ├── index.ts               Entry point
│       ├── types.ts               Shared interfaces
│       ├── simulation.ts          Core step engine, seeded RNG, metrics
│       ├── scenarios.ts           4 preset scenarios
│       ├── routes.ts              Express API routes
│       └── agents/
│           ├── ruleAgent.ts       Urgency-based deterministic agent
│           ├── randomAgent.ts     Random baseline agent
│           ├── heuristicAgent.ts  Penalty ÷ deadline urgency score agent
│           └── qAgent.ts         Q-table agent with epsilon-greedy decay
└── frontend/
    └── src/
        ├── App.tsx                Orchestration only
        ├── api.ts                 Axios API calls
        ├── types.ts               Shared frontend types
        ├── hooks/
        │   └── useSimulation.ts   All state and simulation logic
        └── components/
            ├── Header.tsx
            ├── Controls.tsx
            ├── InvoiceTable.tsx
            ├── Charts.tsx
            ├── ActionLog.tsx
            ├── AgentSelector.tsx
            ├── ScenarioSelector.tsx
            ├── MetricsPanel.tsx
            ├── EpisodeChart.tsx
            ├── BenchmarkTable.tsx
            ├── QConfigPanel.tsx
            ├── ExportButton.tsx
            ├── AllPaidBanner.tsx
            └── LoadingScreen.tsx
```

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Clone
git clone https://github.com/aniruddhballal/VenPayRL.git
cd VenPayRL

# Backend
cd backend
npm install
npm run dev       # runs on http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev       # runs on http://localhost:5173
```

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/state` | Current simulation state |
| GET | `/api/scenarios` | All available scenarios |
| POST | `/api/reset` | Reset sim (`scenarioId`, `seed`) |
| POST | `/api/agent-step` | Advance one step (`agentType`) |
| POST | `/api/run-episodes` | Train for N episodes (`agentType`, `episodes`, `scenarioId`) |
| POST | `/api/run-experiment` | Full benchmark — all agents × all scenarios (`seeds`, `trainingEpisodes`) |
| POST | `/api/q-config` | Update Q-agent hyperparameters |

---

## Agents

### Rule-based
Deterministic. Sorts unpaid invoices by days until due and pays the most urgent ones if cash allows. Predictable and stable but not adaptive.

### Random
Randomly selects full pay, partial pay, or delay for each invoice each step. Serves as the untrained baseline — any trained agent should beat this clearly.

### Heuristic
Combines penalty rate and deadline proximity into a single urgency score (`penaltyRate / max(daysUntilDue, 1)`). Invoices with high penalty rates and close deadlines are prioritised first. Consistently outperforms random and is a strong baseline for the Q-agent to beat.

### Q-Table Agent
Learns a payment policy over episodes using Q-learning with epsilon-greedy exploration. State space is discretized into:

- **Cash buckets** (5 levels, 0–100% of max cash)
- **Urgency buckets** (4 levels: overdue / urgent / upcoming / safe)
- **Overdue count buckets** (3 levels: 0 / 1 / 2+)

Hyperparameters are configurable via the UI:

| Parameter | Default | Description |
|---|---|---|
| Learning rate (α) | 0.1 | How fast Q-values update |
| Discount factor (γ) | 0.95 | Weight given to future rewards |
| Epsilon decay | 0.995 | Rate at which exploration decreases |
| Epsilon min | 0.05 | Floor on exploration probability |

Epsilon starts at 1.0 (fully exploratory) and decays toward `epsilonMin` each episode. After training, epsilon is frozen at 0 for evaluation.

---

## Scenarios

| Scenario | Cash | Notes |
|---|---|---|
| Balanced | $10,000 | Standard starting point, mixed deadlines |
| Tight Cash | $4,000 | Cash is scarce relative to total invoice value |
| High Penalty | $12,000 | Aggressive penalty rates — timing is critical |
| Many Invoices | $15,000 | 8 vendors simultaneously, high juggling complexity |

All scenarios support a configurable seed for fully reproducible runs.

---

## Reward Function

```
step_reward =
  + (10 - delayed_days * 2)    on FULL_PAY
  - 2                           on PARTIAL_PAY
  - (amount × penaltyRate)      on DELAY
  - (amount × penaltyRate × 2)  on OVERDUE (auto-triggered)
  + (cash × 0.0005)             each step (cash conservation bonus)
```

---

## Benchmark & Stability

The **Run Experiment** button benchmarks all four agents across all four scenarios. For each agent-scenario pair it:

1. Trains the Q-agent fresh for N episodes (configurable)
2. Evaluates each agent across K seeds (default 10)
3. Reports average reward, standard deviation, average final cash, and average penalties

The winner per scenario is determined by highest average reward. Standard deviation is shown to surface lucky runs vs genuinely stable performance.

Results can be exported as CSV or JSON.

---

## Where We Started

The project began as a single-file simulation with one agent (rule-based) and a basic UI showing invoices, an action log, and two charts. There was no learning, no scenarios, and no way to compare agents.

---

## Where We Are Now

- 4 agents: rule-based, random, heuristic, Q-table with epsilon-greedy
- 4 scenarios with seeded RNG for reproducibility
- Full episode training loop (up to 2000 episodes)
- Per-episode reward chart with 20-episode moving average
- Full benchmark suite: all agents × all scenarios × multiple seeds
- Avg reward + std deviation per agent-scenario pair
- Q-agent hyperparameter tuning via UI sliders
- Action constraints enforced (no negative cash, no overpaying)
- Metrics panel: total reward, final cash, cash delta, penalties paid
- CSV and JSON export for episodes and benchmark results
- Fully modular codebase: isolated components, custom hook, agent directory

---

## Potential Next Steps

- Neural network agent (DQN) replacing the Q-table
- Multi-company / portfolio environment
- Side-by-side agent comparison in a single simulation run
- Persistent training across sessions (save/load Q-table)
- Curriculum learning: start easy scenarios, progress to hard
