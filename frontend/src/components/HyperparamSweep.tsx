import { useState } from 'react'
import type { SweepResult, HyperparamSweepConfig } from '../types'

interface Props {
  sweepResults: SweepResult[]
  sweepRunning: boolean
  scenarioId: string
  onRun: (config: HyperparamSweepConfig) => void
}

const qParams = ['alpha', 'gamma', 'epsilonDecay', 'epsilonMin']
const dqnParams = ['learningRate', 'gamma', 'epsilonDecay', 'epsilonMin', 'batchSize']

function parseValues(raw: string): number[] {
  return raw.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
}

export default function HyperparamSweep({ sweepResults, sweepRunning, scenarioId, onRun }: Props) {
  const [agentType, setAgentType] = useState<'qtable' | 'dqn'>('qtable')
  const [param1, setParam1] = useState('alpha')
  const [values1, setValues1] = useState('0.01, 0.05, 0.1, 0.2, 0.3')
  const [param2, setParam2] = useState('')
  const [values2, setValues2] = useState('')
  const [episodes, setEpisodes] = useState(200)
  const [seeds, setSeeds] = useState(5)

  const params = agentType === 'qtable' ? qParams : dqnParams

  const handleRun = () => {
    const config: HyperparamSweepConfig = {
      agentType,
      scenarioId,
      param1,
      values1: parseValues(values1),
      param2: param2 || undefined,
      values2: param2 ? parseValues(values2) : undefined,
      episodes,
      seeds,
    }
    onRun(config)
  }

  const maxReward = sweepResults.length > 0 ? Math.max(...sweepResults.map(r => r.avgReward)) : 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Hyperparameter Sweep</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Agent</label>
          <select
            value={agentType}
            onChange={e => { setAgentType(e.target.value as 'qtable' | 'dqn'); setParam1(e.target.value === 'qtable' ? 'alpha' : 'learningRate') }}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300"
          >
            <option value="qtable">Q-Table</option>
            <option value="dqn">DQN</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Param 1</label>
          <select
            value={param1}
            onChange={e => setParam1(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300"
          >
            {params.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 block mb-1">Values for Param 1 (comma-separated)</label>
          <input
            type="text" value={values1}
            onChange={e => setValues1(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300 font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Param 2 (optional)</label>
          <select
            value={param2}
            onChange={e => setParam2(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300"
          >
            <option value="">None</option>
            {params.filter(p => p !== param1).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {param2 && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">Values for Param 2</label>
            <input
              type="text" value={values2}
              onChange={e => setValues2(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300 font-mono"
            />
          </div>
        )}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Episodes per combo</label>
          <input
            type="number" value={episodes} min={50} max={1000}
            onChange={e => setEpisodes(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Seeds per combo</label>
          <input
            type="number" value={seeds} min={1} max={20}
            onChange={e => setSeeds(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-300"
          />
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={sweepRunning}
        className="w-full px-4 py-2 text-xs bg-teal-800 border border-teal-600 rounded hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
      >
        {sweepRunning ? 'Running sweep...' : '⚡ Run Sweep'}
      </button>

      {sweepResults.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="text-xs text-gray-500 mb-2">Results — sorted by avg reward</div>
          {[...sweepResults]
            .sort((a, b) => b.avgReward - a.avgReward)
            .map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <div className="flex gap-2 min-w-40">
                  <span className="text-gray-500">{param1}=</span>
                  <span className="font-mono text-violet-300">{r.param1Val}</span>
                  {r.param2Val !== undefined && (
                    <>
                      <span className="text-gray-500">{param2}=</span>
                      <span className="font-mono text-violet-300">{r.param2Val}</span>
                    </>
                  )}
                </div>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-violet-500 transition-all"
                    style={{ width: `${Math.max(0, (r.avgReward / maxReward) * 100)}%` }}
                  />
                </div>
                <span className={`font-mono w-16 text-right ${i === 0 ? 'text-amber-400 font-bold' : 'text-gray-300'}`}>
                  {r.avgReward.toFixed(1)}
                </span>
                <span className="font-mono text-gray-600 w-14 text-right">±{r.stdReward.toFixed(1)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}