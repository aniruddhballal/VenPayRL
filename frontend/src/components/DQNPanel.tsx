import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import type { EpisodePoint, DQNConfig } from '../types'

interface Props {
  data: EpisodePoint[]
  episodeCount: number
  trainingRunning: boolean
  config: DQNConfig
  epsilon: number
  loss: number
  onEpisodeCountChange: (n: number) => void
  onStartTraining: () => void
  onSaveConfig: (c: DQNConfig) => void
}

interface SliderDef {
  key: keyof DQNConfig
  label: string
  min: number
  max: number
  step: number
}

const sliders: SliderDef[] = [
  { key: 'learningRate', label: 'Learning Rate', min: 0.0001, max: 0.01, step: 0.0001 },
  { key: 'gamma', label: 'Discount (γ)', min: 0.5, max: 0.99, step: 0.01 },
  { key: 'epsilonDecay', label: 'Epsilon Decay', min: 0.98, max: 0.999, step: 0.001 },
  { key: 'epsilonMin', label: 'Epsilon Min', min: 0.01, max: 0.2, step: 0.01 },
  { key: 'batchSize', label: 'Batch Size', min: 8, max: 128, step: 8 },
  { key: 'memorySize', label: 'Memory Size', min: 500, max: 5000, step: 500 },
]

const tooltipStyle = { background: '#ffffff', border: '1px solid #e8e8e8', fontSize: 12 }
const tickStyle = { fontSize: 11 }

export default function DQNPanel({ data, episodeCount, trainingRunning, config, epsilon, loss, onEpisodeCountChange, onStartTraining, onSaveConfig }: Props) {
  const [local, setLocal] = useState<DQNConfig>(config)

  const update = (key: keyof DQNConfig, val: number) =>
    setLocal(c => ({ ...c, [key]: val }))

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400">DQN Training</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Episodes</span>
            <input
              type="range" min={50} max={2000} step={50}
              value={episodeCount}
              onChange={e => onEpisodeCountChange(Number(e.target.value))}
              className="w-24 accent-neutral-900"
            />
            <span className="font-mono text-neutral-700 w-10">{episodeCount}</span>
          </div>
          <button
            onClick={onStartTraining}
            disabled={trainingRunning}
            className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-900 rounded hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {trainingRunning ? 'Training DQN...' : '▶ Train DQN'}
          </button>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1">ε (exploration)</div>
          <div className="text-lg font-mono font-bold text-amber-400">{epsilon.toFixed(3)}</div>
          <div className="mt-1.5 w-full bg-neutral-100 rounded-full h-1">
            <div className="bg-amber-500 h-1 rounded-full transition-all" style={{ width: `${epsilon * 100}%` }} />
          </div>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1">Loss (last step)</div>
          <div className="text-lg font-mono font-bold text-rose-400">{loss.toFixed(4)}</div>
        </div>
      </div>

      {/* Charts */}
      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-neutral-400 text-sm">
          Train DQN to see reward and loss trends
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Reward per episode</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="episode" stroke="#a8a8a8" tick={tickStyle} />
                <YAxis stroke="#a8a8a8" tick={tickStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="reward" stroke="#818cf8" dot={false} strokeWidth={1} strokeOpacity={0.5} name="Reward" />
                <Line type="monotone" dataKey="movingAvg" stroke="#f59e0b" dot={false} strokeWidth={2} name="Moving Avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {data.some(d => d.loss !== undefined) && (
            <div>
              <div className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Training loss</div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="episode" stroke="#a8a8a8" tick={tickStyle} />
                  <YAxis stroke="#a8a8a8" tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="loss" stroke="#f87171" dot={false} strokeWidth={1.5} name="Loss" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {data.some(d => d.epsilon !== undefined) && (
            <div>
              <div className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Epsilon decay</div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="episode" stroke="#a8a8a8" tick={tickStyle} />
                  <YAxis stroke="#a8a8a8" tick={tickStyle} domain={[0, 1]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="epsilon" stroke="#34d399" dot={false} strokeWidth={1.5} name="Epsilon" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Config */}
      <div className="border-t border-neutral-200 pt-4">
        <div className="text-xs text-neutral-400 uppercase tracking-widest mb-3">Hyperparameters</div>
        <div className="grid grid-cols-2 gap-4">
          {sliders.map(s => (
            <div key={s.key}>
              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span>{s.label}</span>
                <span className="font-mono text-neutral-700">{local[s.key]}</span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={s.step}
                value={local[s.key]}
                onChange={e => update(s.key, Number(e.target.value))}
                className="w-full accent-neutral-900"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => onSaveConfig(local)}
          className="mt-4 w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-900 rounded hover:bg-violet-600 transition-colors text-white"
        >
          Apply DQN Config
        </button>
      </div>
    </div>
  )
}