import { useState } from 'react'
import type { QAgentConfig } from '../types'

interface Props { config: QAgentConfig; onSave: (c: QAgentConfig) => void }

const sliders = [
  { key: 'alpha' as const,        label: 'Learning Rate α',  min: 0.01, max: 0.5,   step: 0.01  },
  { key: 'gamma' as const,        label: 'Discount γ',       min: 0.5,  max: 0.99,  step: 0.01  },
  { key: 'epsilonDecay' as const, label: 'Epsilon Decay',    min: 0.98, max: 0.999, step: 0.001 },
  { key: 'epsilonMin' as const,   label: 'Epsilon Min',      min: 0.01, max: 0.2,   step: 0.01  },
]

export default function QConfigPanel({ config, onSave }: Props) {
  const [local, setLocal] = useState<QAgentConfig>(config)
  const update = (k: keyof QAgentConfig, v: number) => setLocal(c => ({ ...c, [k]: v }))

  return (
    <div className="card p-4">
      <p className="label mb-4">Q-Agent Tuning</p>
      <div className="space-y-4">
        {sliders.map(s => (
          <div key={s.key}>
            <div className="flex justify-between items-center mb-1.5">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-primary)' }}>
                {local[s.key].toFixed(3)}
              </span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step}
                   value={local[s.key]} onChange={e => update(s.key, Number(e.target.value))}
                   style={{ width: '100%' }} />
          </div>
        ))}
      </div>
      <button onClick={() => onSave(local)} className="btn-primary mt-4 w-full justify-center">
        Apply Config
      </button>
    </div>
  )
}