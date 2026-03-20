import { useState, useEffect, useRef } from 'react'
import { getState, resetSim, agentStep } from './api'
import type { SimState, HistoryPoint } from './types'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

export default function App() {
  const [state, setState] = useState<SimState | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(600)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const s = await getState()
    setState(s)
    setHistory([{ day: s.day, cash: s.cash, reward: s.totalReward }])
  }

  const reset = async () => {
    stopAuto()
    const s = await resetSim(10000)
    setState(s)
    setHistory([{ day: 0, cash: s.cash, reward: 0 }])
  }

  const stepAgent = async () => {
    const { state: s } = await agentStep()
    setState(s)
    setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }])
  }

  const startAuto = () => {
    setRunning(true)
    intervalRef.current = setInterval(async () => {
      const { state: s } = await agentStep()
      setState(s)
      setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }])
      if (s.invoices.every(i => i.paid)) stopAuto()
    }, speed)
  }

  const stopAuto = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  if (!state) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 font-mono">
      Loading VenPayRL...
    </div>
  )

  const allPaid = state.invoices.every(i => i.paid)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-mono p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <h1 className="text-2xl font-bold text-violet-400 tracking-widest uppercase">
            VenPayRL
          </h1>
          <div className="flex gap-6 text-sm text-gray-400">
            <span>Day <strong className="text-gray-100 text-base ml-1">{state.day}</strong></span>
            <span>Cash <strong className="text-green-400 text-base ml-1">${state.cash.toLocaleString()}</strong></span>
            <span>Reward <strong className={`text-base ml-1 ${state.totalReward >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {state.totalReward.toFixed(1)}
            </strong></span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm border border-gray-700 rounded hover:border-violet-500 hover:text-violet-300 transition-colors"
          >
            ↺ Reset
          </button>
          <button
            onClick={stepAgent}
            disabled={running || allPaid}
            className="px-4 py-2 text-sm border border-gray-700 rounded hover:border-violet-500 hover:text-violet-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Step Agent
          </button>
          {!running ? (
            <button
              onClick={startAuto}
              disabled={allPaid}
              className="px-4 py-2 text-sm bg-violet-700 border border-violet-500 rounded hover:bg-violet-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white"
            >
              ▶ Auto Run
            </button>
          ) : (
            <button
              onClick={stopAuto}
              className="px-4 py-2 text-sm bg-red-900 border border-red-700 rounded hover:bg-red-800 transition-colors text-white"
            >
              ⏸ Pause
            </button>
          )}
          <div className="flex items-center gap-3 text-sm text-gray-400 ml-2">
            <span>Speed</span>
            <input
              type="range" min={100} max={1500} step={100}
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-28 accent-violet-500"
            />
            <span className="w-14 text-gray-300">{speed}ms</span>
          </div>
        </div>

        {/* All paid banner */}
        {allPaid && (
          <div className="bg-emerald-950 border border-emerald-700 rounded-lg px-5 py-3 text-emerald-400 text-center text-sm">
            ✅ All invoices settled — Final reward: <strong>{state.totalReward.toFixed(2)}</strong>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Invoices */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Invoices</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 text-xs border-b border-gray-800">
                  <th className="pb-2 font-normal">Vendor</th>
                  <th className="pb-2 font-normal">Amount</th>
                  <th className="pb-2 font-normal">Due</th>
                  <th className="pb-2 font-normal">Penalty</th>
                  <th className="pb-2 font-normal">Delay</th>
                  <th className="pb-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {state.invoices.map(inv => (
                  <tr
                    key={inv.id}
                    className={`border-b border-gray-800/50 ${inv.paid ? 'opacity-30 line-through' : inv.delayed > 0 ? 'text-red-400' : ''}`}
                  >
                    <td className="py-2 text-violet-300">{inv.vendor}</td>
                    <td className="py-2">${inv.amount.toFixed(0)}</td>
                    <td className="py-2">D{inv.dueDate}</td>
                    <td className="py-2">{(inv.penaltyRate * 100).toFixed(0)}%</td>
                    <td className="py-2">{inv.delayed}d</td>
                    <td className="py-2 text-xs">
                      {inv.paid ? (
                        <span className="text-emerald-500">Paid</span>
                      ) : inv.delayed > 0 ? (
                        <span className="text-red-400">Late</span>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Cash over time</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" stroke="#4b5563" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 12 }} />
                  <Line type="monotone" dataKey="cash" stroke="#4ade80" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Cumulative reward</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" stroke="#4b5563" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 12 }} />
                  <Line type="monotone" dataKey="reward" stroke="#f59e0b" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Action log */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Action log</h2>
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {[...state.log].reverse().map((entry, i) => (
              <div
                key={i}
                className={`flex gap-4 items-center text-xs px-3 py-2 rounded border-l-2 bg-gray-950 ${
                  entry.action === 'FULL_PAY'   ? 'border-emerald-500' :
                  entry.action === 'PARTIAL_PAY'? 'border-amber-500' :
                  entry.action === 'DELAYED'    ? 'border-red-400' :
                                                  'border-red-700'
                }`}
              >
                <span className="text-gray-600 w-12 shrink-0">Day {entry.day}</span>
                <span className="text-violet-400 w-24 shrink-0">{entry.vendor}</span>
                <span className="font-semibold w-24 shrink-0">{entry.action}</span>
                <span className="text-gray-400 w-16 shrink-0">${entry.amount}</span>
                <span className={parseFloat(entry.reward) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {parseFloat(entry.reward) >= 0 ? '+' : ''}{parseFloat(entry.reward).toFixed(1)} pts
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}