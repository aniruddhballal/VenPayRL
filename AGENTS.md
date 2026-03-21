# VenPayRL — Agent Guide

## Rule-based Agent
Sorts unpaid invoices by days until due (ascending) and pays in full if urgency ≤ 2 days and cash allows. Falls back to partial if overdue, delay otherwise. Deterministic and stable — a solid baseline but cannot adapt.

## Random Agent
Assigns each invoice a random action (full / partial / delay) each step using a seeded RNG. Intentionally weak — exists to establish a floor that any trained agent should clearly beat.

## Heuristic Agent
Scores each invoice by `penaltyRate / max(daysUntilDue, 1)`. Higher scores mean more urgent. Pays in full if score ≥ 0.02 and cash allows, partial if score ≥ 0.01, otherwise delays. Consistently outperforms random and is the primary target for Q-table and DQN to beat.

## Q-Table Agent
Tabular Q-learning. State = cash bucket (0–4) × urgency bucket (0–3) × overdue count bucket (0–2) = 60 states. Actions = delay / partial / full (per invoice). Updates Q-values via Bellman equation after each step. Uses epsilon-greedy exploration starting at ε=1.0, decaying each episode.

| Param | Default | Effect |
|---|---|---|
| α (alpha) | 0.1 | Learning rate — how fast Q-values update |
| γ (gamma) | 0.95 | Discount — weight given to future rewards |
| ε decay | 0.995 | How quickly exploration reduces per episode |
| ε min | 0.05 | Floor on exploration |

## DQN Agent
Two-layer neural network (64→64→3) replacing the Q-table with function approximation. Uses experience replay (replay buffer of configurable size) and a target network that syncs every 100 steps to stabilise training. State vector per invoice: `[cashRatio, daysUntilDue (norm), penaltyRate, delayed (norm), overdueCount (norm)]`.

| Param | Default | Effect |
|---|---|---|
| Learning rate | 0.001 | Adam optimiser LR |
| γ (gamma) | 0.95 | Discount factor |
| ε decay | 0.995 | Exploration decay per episode |
| ε min | 0.05 | Minimum exploration |
| Batch size | 32 | Experiences sampled per replay step |
| Memory size | 2000 | Max replay buffer size |