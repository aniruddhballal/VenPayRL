import { useState } from 'react'
import type { QAgentConfig } from '../types'

interface Props {
  config: QAgentConfig
  onSave: (c: QAgentConfig) => void
}

interface SliderDef {
  key: keyof QAgentConfig
  label: string
  min: number
  max: number
  step: number
}

const sliders: SliderDef[] = [
  { key: 'alpha', label: 'Learning Rate (α)', min: 0.01, max: 0.5, step: 0.01 },
  { key: 'gamma', label: 'Discount Factor (γ)', min: 0.5, max: 0.99, step: 0.01 },
  { key: 'epsilonDecay', label: 'Epsilon Decay', min: 0.98, max: 0.999, step: 0.001 },
  { key: 'epsilonMin', label: 'Epsilon Min', min: 0.01, max: 0.2, step: 0.01 },
]

export default function QConfigPanel({ config, onSave }: Props) {
  const [local, setLocal] = useState<QAgentConfig>(config)

  const update = (key: keyof QAgentConfig, val: number) =>
    setLocal(c => ({ ...c, [key]: val }))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Q-Agent Tuning</h2>
      <div className="space-y-4">
        {sliders.map(s => (
          <div key={s.key}>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{s.label}</span>
              <span className="font-mono text-violet-300">{local[s.key].toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={s.min} max={s.max} step={s.step}
              value={local[s.key]}
              onChange={e => update(s.key, Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onSave(local)}
        className="mt-4 w-full px-3 py-2 text-xs bg-violet-700 border border-violet-500 rounded hover:bg-violet-600 transition-colors text-white"
      >
        Apply Configa
      </button>
    </div>
  )
}