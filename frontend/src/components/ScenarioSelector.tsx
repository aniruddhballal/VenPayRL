import { useEffect, useState } from 'react'
import { getScenarios } from '../api'
import type { ScenarioConfig } from '../types'

interface Props { scenarioId: string; seed: number; onChange: (s: string) => void; onSeedChange: (n: number) => void }

const scenarioColors: Record<string, string> = {
  balanced:      '#f0fdf4',
  'tight-cash':  '#fef2f2',
  'high-penalty':'#fff7ed',
  'many-invoices':'#eff6ff',
  stochastic:    '#faf5ff',
}

export default function ScenarioSelector({ scenarioId, seed, onChange, onSeedChange }: Props) {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([])
  useEffect(() => { getScenarios().then(setScenarios) }, [])

  return (
    <div className="card p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] mb-4"
         style={{ color: 'var(--color-text-muted)' }}>
        Scenario
      </p>
      <div className="space-y-2">
        {scenarios.map(s => {
          const active = scenarioId === s.id
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150"
              style={{
                border: active ? '2px solid #0a0a0a' : '1px solid var(--color-border)',
                background: active ? (scenarioColors[s.id] ?? '#fafafa') : 'white',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {s.label}
                </span>
                <span className="text-[11px]" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-secondary)' }}>
                  ${s.cash.toLocaleString()}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {s.description}
              </p>
            </button>
          )
        })}
      </div>
      <div className="mt-4 pt-4 flex items-center gap-3"
           style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-[11px] uppercase tracking-[0.06em]"
              style={{ color: 'var(--color-text-muted)' }}>
          Seed
        </span>
        <input
          type="number" value={seed}
          onChange={e => onSeedChange(Number(e.target.value))}
          className="flex-1 h-8 px-2 rounded-lg text-sm text-center"
          style={{
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-primary)',
            background: 'var(--color-surface-raised)',
          }}
        />
      </div>
    </div>
  )
}