import { useEffect, useState } from 'react'
import { getScenarios } from '../api'
import type { ScenarioConfig } from '../types'

interface Props {
  scenarioId: string
  seed: number
  onChange: (scenarioId: string) => void
  onSeedChange: (seed: number) => void
}

export default function ScenarioSelector({ scenarioId, seed, onChange, onSeedChange }: Props) {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([])

  useEffect(() => {
    getScenarios().then(setScenarios)
  }, [])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Scenario</h2>
      <div className="flex flex-col gap-2">
        {scenarios.map(s => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${scenarioId === s.id
                ? 'border-teal-500 bg-teal-950 text-teal-300'
                : 'border-gray-700 hover:border-gray-600 text-gray-400'
              }`}
          >
            <div className="text-sm font-semibold">{s.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-3 text-xs text-gray-500">
        <span>Seed</span>
        <input
          type="number"
          value={seed}
          onChange={e => onSeedChange(Number(e.target.value))}
          className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 font-mono text-xs"
        />
      </div>
    </div>
  )
}