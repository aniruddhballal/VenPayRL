import { useEffect, useState } from 'react'
import { Hash } from 'lucide-react'
import { getScenarios } from '../api'
import type { ScenarioConfig } from '../types'

interface Props { scenarioId: string; seed: number; onChange: (s: string) => void; onSeedChange: (n: number) => void }

export default function ScenarioSelector({ scenarioId, seed, onChange, onSeedChange }: Props) {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([])
  useEffect(() => { getScenarios().then(setScenarios) }, [])

  return (
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
      <div className="flex items-center gap-2.5 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <Hash size={12} style={{ color: 'var(--text-muted)' }} />
        <span className="label">Seed</span>
        <input type="number" value={seed}
               onChange={e => onSeedChange(Number(e.target.value))}
               style={{ width: '72px', textAlign: 'center', fontFamily: 'var(--font-display)' }} />
      </div>
    </div>
  )
}