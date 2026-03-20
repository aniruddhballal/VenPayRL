import axios from 'axios';
import type { SimState, AgentAction } from './types';

const BASE = 'http://localhost:3001/api';

export const getState = (): Promise<SimState> =>
  axios.get(`${BASE}/state`).then(r => r.data);

export const resetSim = (cash: number): Promise<SimState> =>
  axios.post(`${BASE}/reset`, { cash }).then(r => r.data);

export const stepManual = (actions: AgentAction[]): Promise<SimState> =>
  axios.post(`${BASE}/step`, { actions }).then(r => r.data);

export const agentStep = (): Promise<{ state: SimState; actions: AgentAction[] }> =>
  axios.post(`${BASE}/agent-step`).then(r => r.data);

export const runAgent = (steps: number): Promise<{ state: SimState; history: SimState[] }> =>
  axios.post(`${BASE}/run-agent`, { steps }).then(r => r.data);