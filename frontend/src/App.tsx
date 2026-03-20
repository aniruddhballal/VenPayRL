import { useState, useEffect, useRef } from 'react';
import { getState, resetSim, agentStep } from './api';
import type { SimState, HistoryPoint } from './types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './App.css';

export default function App() {
  const [state, setState] = useState<SimState | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(600);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const s = await getState();
    setState(s);
    setHistory([{ day: s.day, cash: s.cash, reward: s.totalReward }]);
  };

  const reset = async () => {
    stopAuto();
    const s = await resetSim(10000);
    setState(s);
    setHistory([{ day: 0, cash: s.cash, reward: 0 }]);
  };

  const stepAgent = async () => {
    const { state: s } = await agentStep();
    setState(s);
    setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }]);
  };

  const startAuto = () => {
    setRunning(true);
    intervalRef.current = setInterval(async () => {
      const { state: s } = await agentStep();
      setState(s);
      setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }]);
      if (s.invoices.every(i => i.paid)) stopAuto();
    }, speed);
  };

  const stopAuto = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  if (!state) return <div className="loading">Loading VenPayRL...</div>;

  const allPaid = state.invoices.every(i => i.paid);

  return (
    <div className="app">
      <header>
        <h1>💼 VenPayRL</h1>
        <div className="stats">
          <span>Day <strong>{state.day}</strong></span>
          <span>Cash <strong>${state.cash.toLocaleString()}</strong></span>
          <span>Reward <strong className={state.totalReward >= 0 ? 'pos' : 'neg'}>{state.totalReward.toFixed(1)}</strong></span>
        </div>
      </header>

      <div className="controls">
        <button onClick={reset}>↺ Reset</button>
        <button onClick={stepAgent} disabled={running || allPaid}>Step Agent</button>
        {!running
          ? <button onClick={startAuto} disabled={allPaid} className="primary">▶ Auto Run</button>
          : <button onClick={stopAuto} className="danger">⏸ Pause</button>
        }
        <label>Speed:
          <input type="range" min={100} max={1500} step={100}
            value={speed} onChange={e => setSpeed(Number(e.target.value))} />
          <span>{speed}ms</span>
        </label>
      </div>

      {allPaid && (
        <div className="banner">
          ✅ All invoices paid! Final reward: {state.totalReward.toFixed(2)}
        </div>
      )}

      <div className="grid">
        <section className="invoices">
          <h2>📋 Invoices</h2>
          <table>
            <thead>
              <tr><th>Vendor</th><th>Amount</th><th>Due</th><th>Penalty/day</th><th>Delayed</th><th>Status</th></tr>
            </thead>
            <tbody>
              {state.invoices.map(inv => (
                <tr key={inv.id} className={inv.paid ? 'paid' : inv.delayed > 0 ? 'late' : ''}>
                  <td>{inv.vendor}</td>
                  <td>${inv.amount.toFixed(0)}</td>
                  <td>Day {inv.dueDate}</td>
                  <td>{(inv.penaltyRate * 100).toFixed(0)}%</td>
                  <td>{inv.delayed}d</td>
                  <td>{inv.paid ? '✅ Paid' : inv.delayed > 0 ? '⚠️ Late' : '⏳ Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="charts">
          <h2>📈 Cash Over Time</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #444' }} />
              <Line type="monotone" dataKey="cash" stroke="#4ade80" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <h2>🏆 Cumulative Reward</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #444' }} />
              <Line type="monotone" dataKey="reward" stroke="#f59e0b" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="log">
        <h2>📜 Action Log</h2>
        <div className="log-scroll">
          {[...state.log].reverse().map((entry, i) => (
            <div key={i} className={`log-entry ${entry.action.toLowerCase()}`}>
              <span className="day">Day {entry.day}</span>
              <span className="vendor">{entry.vendor}</span>
              <span className="action">{entry.action}</span>
              <span className="amount">${entry.amount}</span>
              <span className={`reward ${parseFloat(entry.reward) >= 0 ? 'pos' : 'neg'}`}>
                {parseFloat(entry.reward) >= 0 ? '+' : ''}{parseFloat(entry.reward).toFixed(1)} pts
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}