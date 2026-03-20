import { useState, useEffect, useRef } from 'react'
import { getState, resetSim, agentStep } from './api'
import type { SimState, HistoryPoint } from './types'
import Header from './components/Header'
import Controls from './components/Controls'
import InvoiceTable from './components/InvoiceTable'
import Charts from './components/Charts'
import ActionLog from './components/ActionLog'

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
        <Header state={state} />
        <Controls
          running={running}
          allPaid={allPaid}
          speed={speed}
          onReset={reset}
          onStep={stepAgent}
          onStart={startAuto}
          onStop={stopAuto}
          onSpeedChange={setSpeed}
        />
        {allPaid && (
          <div className="bg-emerald-950 border border-emerald-700 rounded-lg px-5 py-3 text-emerald-400 text-center text-sm">
            ✅ All invoices settled — Final reward: <strong>{state.totalReward.toFixed(2)}</strong>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceTable invoices={state.invoices} />
          <Charts history={history} />
        </div>
        <ActionLog log={state.log} />
      </div>
    </div>
  )
}