import { useEffect } from 'react'
import { useSimulation } from './hooks/useSimulation'
import LoadingScreen from './components/LoadingScreen'
import Header from './components/Header'
import Controls from './components/Controls'
import AllPaidBanner from './components/AllPaidBanner'
import InvoiceTable from './components/InvoiceTable'
import Charts from './components/Charts'
import ActionLog from './components/ActionLog'

export default function App() {
  const { state, history, running, speed, setSpeed, load, reset, stepAgent, startAuto, stopAuto } = useSimulation()

  useEffect(() => { load() }, [])

  if (!state) return <LoadingScreen />

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
        {allPaid && <AllPaidBanner totalReward={state.totalReward} />}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceTable invoices={state.invoices} />
          <Charts history={history} />
        </div>
        <ActionLog log={state.log} />
      </div>
    </div>
  )
}