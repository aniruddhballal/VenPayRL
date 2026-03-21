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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      <Header state={sim.state} mode={mode} onModeChange={setMode} />

      {/* Two-pane layout with independent scrolls */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxWidth: '1600px', width: '100%', margin: '0 auto', padding: '0 24px' }}>

        {/* Sidebar — independent scroll */}
        <div style={{
          width: '350px',
          flexShrink: 0,
          overflowY: 'auto',
          paddingTop: '20px',
          paddingBottom: '40px',
          paddingRight: '16px',
          borderRight: '1px solid var(--border)',
        }}>
          <Sidebar sim={sim} />
        </div>

        {/* Main content — independent scroll */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: '20px',
          paddingBottom: '40px',
          paddingLeft: '24px',
          minWidth: 0,
        }}>
          {mode === 'simulate'
            ? <SimulateView sim={sim} />
            : <AnalyseView  sim={sim} />
          }
        </div>

      </div>
    </div>
  )
}