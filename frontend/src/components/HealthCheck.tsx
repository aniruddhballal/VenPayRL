import type { HealthCheckResult, AgentType } from '../types'

interface Props {
  results:     HealthCheckResult[]
  running:     boolean
  onRun:       () => void
}

const agentLabels: Record<AgentType, string> = {
  rule:      'Rule',
  random:    'Random',
  heuristic: 'Heuristic',
  qtable:    'Q-Table',
  dqn:       'DQN',
}

export default function HealthCheck({ results, running, onRun }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs uppercase tracking-widest text-gray-500">System Health Check</h2>
        <button
          onClick={onRun}
          disabled={running}
          className="px-3 py-1.5 text-xs bg-teal-800 border border-teal-600 rounded hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          {running ? 'Checking...' : '⚡ Run Health Check'}
        </button>
      </div>

      {results.length === 0 ? (
        <div className="h-16 flex items-center justify-center text-gray-600 text-sm">
          Runs one episode per agent on balanced/seed 42 — quick sanity check
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-600 border-b border-gray-800">
              <th className="text-left pb-2 font-normal">Agent</th>
              <th className="text-right pb-2 font-normal">Reward</th>
              <th className="text-right pb-2 font-normal">Cash</th>
              <th className="text-right pb-2 font-normal">Penalties</th>
              <th className="text-right pb-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.agentType} className="border-b border-gray-800/40">
                <td className="py-2 text-violet-400">{agentLabels[r.agentType]}</td>
                <td className="py-2 text-right font-mono text-gray-200">{r.reward.toFixed(1)}</td>
                <td className="py-2 text-right font-mono text-green-400">${r.cash.toFixed(0)}</td>
                <td className="py-2 text-right font-mono text-red-400">${r.penalties.toFixed(0)}</td>
                <td className="py-2 text-right">
                  {r.pass
                    ? <span className="text-emerald-400 font-bold">✓ pass</span>
                    : <span className="text-red-400 font-bold">✗ fail</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}