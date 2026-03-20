import type { SimState, AgentAction } from './types';

export function agentDecide(state: SimState): AgentAction[] {
  const { day, cash, invoices } = state;
  const actions: AgentAction[] = [];
  let remaining = cash;

  const unpaid = invoices
    .filter(i => !i.paid)
    .sort((a, b) => (a.dueDate + a.delayed) - (b.dueDate + b.delayed));

  for (const inv of unpaid) {
    const urgency = (inv.dueDate + inv.delayed) - day;
    const cost = inv.amount * (1 + inv.penaltyRate * inv.delayed);

    if (urgency <= 2 && remaining >= cost) {
      actions.push({ invoiceId: inv.id, type: 'full' });
      remaining -= cost;
    } else if (urgency <= 0) {
      if (remaining >= cost * 0.4) {
        actions.push({ invoiceId: inv.id, type: 'partial', amount: cost * 0.4 });
        remaining -= cost * 0.4;
      } else {
        actions.push({ invoiceId: inv.id, type: 'delay' });
      }
    } else {
      actions.push({ invoiceId: inv.id, type: 'delay' });
    }
  }

  return actions;
}