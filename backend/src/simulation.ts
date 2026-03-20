import { v4 as uuid } from 'uuid';
import type { SimState, AgentAction } from './types';

export function createInitialState(cash = 10000): SimState {
  return {
    day: 0,
    cash,
    totalReward: 0,
    invoices: [
      { id: uuid(), vendor: 'Acme Corp', amount: 2000, dueDate: 5, penaltyRate: 0.05, paid: false, delayed: 0 },
      { id: uuid(), vendor: 'BuildCo', amount: 3500, dueDate: 8, penaltyRate: 0.03, paid: false, delayed: 0 },
      { id: uuid(), vendor: 'SupplyMax', amount: 1500, dueDate: 12, penaltyRate: 0.08, paid: false, delayed: 0 },
      { id: uuid(), vendor: 'TechVendors', amount: 4000, dueDate: 15, penaltyRate: 0.04, paid: false, delayed: 0 },
      { id: uuid(), vendor: 'LogiTrans', amount: 800, dueDate: 20, penaltyRate: 0.06, paid: false, delayed: 0 },
    ],
    log: [],
  };
}

export function stepSimulation(state: SimState, actions: AgentAction[]): SimState {
  const next: SimState = structuredClone(state);
  next.day += 1;

  const actionMap = new Map(actions.map(a => [a.invoiceId, a]));
  let stepReward = 0;

  for (const inv of next.invoices) {
    if (inv.paid) continue;

    const action = actionMap.get(inv.id);
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed);

    if (action?.type === 'full') {
      next.cash -= cost;
      const r = 10 - inv.delayed * 2;
      stepReward += r;
      next.log.push({ day: next.day, vendor: inv.vendor, action: 'FULL_PAY', amount: cost.toFixed(2), reward: r.toFixed(2) });
      inv.paid = true;

    } else if (action?.type === 'partial') {
      const partial = action.amount ?? inv.amount * 0.4;
      next.cash -= partial;
      inv.amount -= partial;
      stepReward -= 2;
      next.log.push({ day: next.day, vendor: inv.vendor, action: 'PARTIAL_PAY', amount: partial.toFixed(2), reward: '-2' });

    } else if (action?.type === 'delay') {
      inv.delayed += 1;
      const penalty = inv.amount * inv.penaltyRate;
      stepReward -= penalty;
      next.log.push({ day: next.day, vendor: inv.vendor, action: 'DELAYED', amount: penalty.toFixed(2), reward: (-penalty).toFixed(2) });

    } else if (next.day >= inv.dueDate + inv.delayed) {
      inv.delayed += 1;
      const penalty = inv.amount * inv.penaltyRate * 2;
      stepReward -= penalty;
      next.log.push({ day: next.day, vendor: inv.vendor, action: 'OVERDUE', amount: penalty.toFixed(2), reward: (-penalty).toFixed(2) });
    }
  }

  stepReward += next.cash * 0.0005;
  next.totalReward = parseFloat((next.totalReward + stepReward).toFixed(2));
  next.cash = parseFloat(next.cash.toFixed(2));

  return next;
}