import { useState, useEffect } from 'react'
import { useSimulation }  from './hooks/useSimulation'
import LoadingScreen      from './components/LoadingScreen'
import Header             from './components/Header'
import Sidebar            from './components/Sidebar'
import SimulateView       from './components/SimulateView'
import AnalyseView        from './components/AnalyseView'

export type Mode = 'simulate' | 'analyse'

export default function App() {
  const sim  = useSimulation()
  const [mode, setMode] = useState<Mode>('simulate')

  useEffect(() => { sim.load() }, [])
  if (!sim.state) return <LoadingScreen />

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Header state={sim.state} mode={mode} onModeChange={setMode} />
      <div className="max-w-screen-2xl mx-auto px-6 pt-5 pb-12 flex gap-5 items-start">
        <Sidebar sim={sim} />
        <div className="flex-1 min-w-0">
          {mode === 'simulate'
            ? <SimulateView sim={sim} />
            : <AnalyseView  sim={sim} />
          }
        </div>
      </div>
    </div>
  )
}