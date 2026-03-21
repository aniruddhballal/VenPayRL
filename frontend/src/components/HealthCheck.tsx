import type { HealthCheckResult, AgentType } from '../types'

interface Props { results: HealthCheckResult[]; running: boolean; onRun: () => Promise<void> }

const agentLabels: Record<AgentType, string> = {
  rule: 'Rule', random: 'Random', heuristic: 'Heuristic', qtable: 'Q-Table', dqn: 'DQN',
}

export default function HealthCheck({ results, running, onRun }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          One episode per agent on balanced/seed 42
        </p>
        <button
          onClick={onRun} disabled={running}
          className="inline-flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#0a0a0a', color: 'white', opacity: running ? 0.5 : 1, cursor: running ? 'not-allowed' : 'pointer' }}
        >
          {running ? 'Checking…' : '⚡ Run Check'}
        </button>
      </div>

      {results.length > 0 && (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Agent', 'Reward', 'Cash', 'Penalties', 'Status'].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] font-medium uppercase tracking-[0.06em]"
                    style={{ color: 'var(--color-text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.agentType} className="hoverable"
                  style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="py-2.5 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {agentLabels[r.agentType]}
                </td>
                <td className="py-2.5 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                  {r.reward.toFixed(1)}
                </td>
                <td className="py-2.5 text-xs" style={{ color: 'var(--color-positive)' }}>
                  ${r.cash.toFixed(0)}
                </td>
                <td className="py-2.5 text-xs" style={{ color: 'var(--color-negative)' }}>
                  ${r.penalties.toFixed(0)}
                </td>
                <td className="py-2.5">
                  {r.pass
                    ? <span className="text-xs font-medium" style={{ color: 'var(--color-positive)' }}>✓ pass</span>
                    : <span className="text-xs font-medium" style={{ color: 'var(--color-negative)' }}>✗ fail</span>
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