import { type Request, type Response, Router } from 'express'
import { createInitialState, stepSimulation } from './simulation';
import { agentDecide } from './agent';
import type { SimState, AgentAction } from './types';

export const router = Router();
let state: SimState = createInitialState();

router.get('/state', (_req: Request, res: Response) => res.json(state));

router.post('/reset', (req: Request, res: Response) => {
  state = createInitialState(req.body.cash ?? 10000);
  res.json(state);
});

router.post('/step', (req: Request, res: Response) => {
  const actions: AgentAction[] = req.body.actions ?? [];
  state = stepSimulation(state, actions);
  res.json(state);
});

router.post('/agent-step', (_req: Request, res: Response) => {
  const actions = agentDecide(state);
  state = stepSimulation(state, actions);
  res.json({ state, actions });
});

router.post('/run-agent', (req: Request, res: Response) => {
  const steps: number = req.body.steps ?? 25;
  const history: SimState[] = [];
  for (let i = 0; i < steps; i++) {
    const actions = agentDecide(state);
    state = stepSimulation(state, actions);
    history.push(structuredClone(state));
    if (state.invoices.every(inv => inv.paid)) break;
  }
  res.json({ state, history });
});