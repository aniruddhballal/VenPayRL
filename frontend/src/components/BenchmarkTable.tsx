import type { BenchmarkResult, AgentType } from '../types'

interface Props {
  results: BenchmarkResult[]
  experimentRunning: boolean
  seeds: number
  trainingEpisodes: number
  onSeedsChange: (n: number) => void
  onRun: () => void
}

const agentLabels: Record<AgentType, string> = {
  rule: 'Rule',
  random: 'Random',
  heuristic: 'Heuristic',
  qtable: 'Q-Table',
}

const agentColors: Record<AgentType, string> = {
  rule: 'text-blue-400',
  random: 'text-gray-400',
  heuristic: 'text-teal-400',
  qtable: 'text-violet-400',
}

export default function BenchmarkTable({ results, experimentRunning, seeds, trainingEpisodes, onSeedsChange, onRun }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xs uppercase tracking-widest text-gray-500">Benchmark — All Agents × All Scenarios</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Seeds</span>
            <input
              type="range" min={5} max={30} step={5}
              value={seeds}
              onChange={e => onSeedsChange(Number(e.target.value))}
              className="w-20 accent-violet-500"
            />
            <span className="font-mono text-gray-300 w-4">{seeds}</span>
          </div>
          <div className="text-xs text-gray-600">× {trainingEpisodes} train eps</div>
          <button
            onClick={onRun}
            disabled={experimentRunning}
            className="px-4 py-1.5 text-xs bg-teal-800 border border-teal-600 rounded hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold"
          >
            {experimentRunning ? 'Running experiment...' : '⚡ Run Experiment'}
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-600 text-sm">
          Click "Run Experiment" to benchmark all agents across all scenarios
        </div>
      ) : (
        <div className="space-y-6">
          {results.map(bench => (
            <div key={bench.scenarioId}>
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 capitalize">
                {bench.scenarioId.replace('-', ' ')}
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-600 border-b border-gray-800">
                    <th className="text-left pb-2 font-normal">Agent</th>
                    <th className="text-right pb-2 font-normal">Avg Reward</th>
                    <th className="text-right pb-2 font-normal">± Std</th>
                    <th className="text-right pb-2 font-normal">Avg Cash</th>
                    <th className="text-right pb-2 font-normal">Avg Penalties</th>
                    <th className="text-right pb-2 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {bench.stats
                    .sort((a, b) => b.avgReward - a.avgReward)
                    .map(s => (
                      <tr key={s.agentType} className={`border-b border-gray-800/40 ${s.winner ? 'bg-gray-800/30' : ''}`}>
                        <td className={`py-2 font-semibold ${agentColors[s.agentType]}`}>
                          {agentLabels[s.agentType]}
                        </td>
                        <td className="py-2 text-right font-mono text-gray-200">{s.avgReward.toFixed(1)}</td>
                        <td className="py-2 text-right font-mono text-gray-500">±{s.stdReward.toFixed(1)}</td>
                        <td className="py-2 text-right font-mono text-green-400">${s.avgFinalCash.toFixed(0)}</td>
                        <td className="py-2 text-right font-mono text-red-400">${s.avgPenalties.toFixed(0)}</td>
                        <td className="py-2 text-right">
                          {s.winner && (
                            <span className="text-xs px-2 py-0.5 bg-amber-900 border border-amber-700 text-amber-400 rounded-full">
                              winner
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}