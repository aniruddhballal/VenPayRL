import { Zap, CheckCircle2, XCircle } from 'lucide-react'
import type { HealthCheckResult, AgentType } from '../types'

interface Props { results: HealthCheckResult[]; running: boolean; onRun: () => Promise<void> }

const agentLabels: Record<AgentType, string> = { rule: 'Rule', random: 'Random', heuristic: 'Heuristic', qtable: 'Q-Table', dqn: 'DQN' }

export default function HealthCheck({ results, running, onRun }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          One episode per agent — balanced scenario, seed 42
        </p>
        <button onClick={onRun} disabled={running} className="btn-primary">
          <Zap size={13} /> {running ? 'Checking' : 'Run Check'}
        </button>
      </div>
      {results.length > 0 && (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Agent', 'Reward', 'Cash', 'Penalties', 'Status'].map(h => (
                <th key={h} className="label pb-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.agentType} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {agentLabels[r.agentType]}
                </td>
                <td className="py-2.5" style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>
                  {r.reward.toFixed(1)}
                </td>
                <td className="py-2.5" style={{ fontSize: '12px', color: 'var(--positive)' }}>
                  ${r.cash.toFixed(0)}
                </td>
                <td className="py-2.5" style={{ fontSize: '12px', color: 'var(--negative)' }}>
                  ${r.penalties.toFixed(0)}
                </td>
                <td className="py-2.5">
                  {r.pass
                    ? <CheckCircle2 size={15} style={{ color: 'var(--positive)' }} />
                    : <XCircle      size={15} style={{ color: 'var(--negative)' }} />
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