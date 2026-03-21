import { useEffect } from 'react'
import { useSimulation }     from './hooks/useSimulation'
import LoadingScreen         from './components/LoadingScreen'
import Header                from './components/Header'
import Sidebar               from './components/Sidebar'
import SimulationPanel       from './components/SimulationPanel'
import AnalysisPanel         from './components/AnalysisPanel'

export default function App() {
  const sim = useSimulation()
  useEffect(() => { sim.load() }, [])
  if (!sim.state) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: 'var(--font-sans)' }}>
      <Header state={sim.state} />
      <div className="max-w-screen-2xl mx-auto px-6 pb-12 pt-6">
        <div className="flex gap-6 items-start">
          <Sidebar sim={sim} />
          <div className="flex-1 min-w-0 space-y-4">
            <SimulationPanel sim={sim} />
            <AnalysisPanel sim={sim} />
          </div>
        </div>
      </div>
    </div>
  )
}