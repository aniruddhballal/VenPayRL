# VenPayRL — Metrics & Reward Guide

## Reward Function

Computed each simulation step and accumulated into `totalReward`.

| Event | Reward |
|---|---|
| FULL_PAY | `+10 - (delayed_days × 2)` — pays well on time, penalises late full pays |
| PARTIAL_PAY | `-2` — small penalty for not settling |
| DELAYED | `-(amount × penaltyRate)` — daily compounding cost |
| OVERDUE (auto) | `-(amount × penaltyRate × 2)` — double penalty, auto-triggered when day ≥ dueDate + delayed |
| Cash conservation | `+(cash × 0.0005)` per step — small incentive to preserve cash |

In stochastic mode, `penaltyRate` is multiplied by `1 + (rand × 2 - 1) × lateFeeVariance` introducing ±variance per delay event.

## Benchmark Metrics

| Metric | Description |
|---|---|
| Avg Reward | Mean total reward across all evaluation seeds |
| ± Std | Standard deviation — lower = more stable agent |
| Avg Final Cash | Mean cash remaining at episode end |
| Avg Penalties | Mean total penalty dollars paid |

Winner per scenario = highest avg reward (primary). Final cash and penalties shown for context.

## Scenario Configs

| Scenario | Cash | Invoices | Penalty Rates | Notes |
|---|---|---|---|---|
| Balanced | $10,000 | 5 | 3–8% | Standard baseline |
| Tight Cash | $4,000 | 4 | 5–9% | Cash scarce, forces prioritisation |
| High Penalty | $12,000 | 5 | 12–25% | Timing critical |
| Many Invoices | $15,000 | 8 | 3–9% | High concurrency |
| Stochastic | $8,000 | 4 | 5–8% | ±20% fee variance, $200/day inflow |