import { useEffect, useState } from 'react'
import { Hash, SlidersHorizontal } from 'lucide-react'
import { getScenarios } from '../api'
import type { ScenarioConfig, SimState } from '../types'
import CustomScenarioDrawer from './CustomScenarioDrawer'

interface Props {
  scenarioId:    string
  seed:          number
  onChange:      (s: string) => void
  onSeedChange:  (n: number) => void
  onCustomApply: (scenario: ScenarioConfig, state: SimState) => void
}

export default function ScenarioSelector({ scenarioId, seed, onChange, onSeedChange, onCustomApply }: Props) {
  const [scenarios,     setScenarios]     = useState<ScenarioConfig[]>([])
  const [drawerOpen,    setDrawerOpen]    = useState(false)

  useEffect(() => { getScenarios().then(setScenarios) }, [])

  const handleCustomApply = (scenario: ScenarioConfig, state: SimState) => {
    // Add custom to local list if not already there
    setScenarios(prev => {
      const exists = prev.find(s => s.id === 'custom')
      return exists ? prev.map(s => s.id === 'custom' ? scenario : s) : [...prev, scenario]
    })
    onChange('custom')
    onCustomApply(scenario, state)
  }

  return (
    <>
      <div className="card p-4">
        <p className="label mb-3">Scenario</p>
        <div className="space-y-1.5">
          {scenarios.map(s => {
            const active = scenarioId === s.id
            return (
              <button key={s.id} onClick={() => onChange(s.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150"
                      style={{
                        border: active ? '1.5px solid var(--text-primary)' : '1px solid var(--border)',
                        background: active ? 'var(--surface)' : 'transparent',
                      }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', fontWeight: active ? 500 : 400, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {s.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    ${s.cash.toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {s.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Custom scenario button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-full mt-2 btn-secondary justify-center"
          style={{ fontSize: '12px', height: '32px' }}
        >
          <SlidersHorizontal size={12} /> Custom scenario
        </button>

        <div className="flex items-center gap-2.5 mt-3 pt-3"
             style={{ borderTop: '1px solid var(--border)' }}>
          <Hash size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="label">Seed</span>
          <input type="number" value={seed}
                 onChange={e => onSeedChange(Number(e.target.value))}
                 style={{ width: '72px', textAlign: 'center', fontFamily: 'var(--font-display)' }} />
        </div>
      </div>

      <CustomScenarioDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={handleCustomApply}
      />
    </>
  )
}