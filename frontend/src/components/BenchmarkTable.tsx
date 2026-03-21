import { Zap } from 'lucide-react'
import type { BenchmarkResult, AgentType } from '../types'

interface Props {
  results: BenchmarkResult[]; experimentRunning: boolean; seeds: number
  trainingEpisodes: number; onSeedsChange: (n: number) => void; onRun: () => void
}

const agentLabels: Record<AgentType, string> = { rule: 'Rule', random: 'Random', heuristic: 'Heuristic', qtable: 'Q-Table', dqn: 'DQN' }
const agentDot:   Record<AgentType, string>  = { rule: '#3B82F6', random: '#A8A49C', heuristic: '#10B981', qtable: '#8B5CF6', dqn: '#EC4899' }

export default function BenchmarkTable({ results, experimentRunning, seeds, trainingEpisodes, onSeedsChange, onRun }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="label">Seeds</span>
          <input type="range" min={5} max={30} step={5} value={seeds}
                 onChange={e => onSeedsChange(Number(e.target.value))} style={{ width: '80px' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--text-primary)' }}>{seeds}</span>
          <span className="label ml-2">× {trainingEpisodes} train eps</span>
        </div>
        <button onClick={onRun} disabled={experimentRunning} className="btn-primary">
          <Zap size={13} /> {experimentRunning ? 'Running' : 'Run Experiment'}
        </button>
      </div>

      {results.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
          Run the experiment to compare all agents across all scenarios
        </p>
      ) : (
        <div className="space-y-6">
          {results.map(bench => (
            <div key={bench.scenarioId}>
              <p className="label mb-3" style={{ textTransform: 'capitalize' }}>
                {bench.scenarioId.replace('-', ' ')}
              </p>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Agent', 'Avg Reward', '± Std', 'Avg Cash', 'Penalties', ''].map(h => (
                      <th key={h} className="label pb-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...bench.stats].sort((a, b) => b.avgReward - a.avgReward).map(s => (
                    <tr key={s.agentType} className="row-hover"
                        style={{ borderBottom: '1px solid var(--border)', background: s.winner ? '#FFFBF0' : 'transparent' }}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: agentDot[s.agentType] }} />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {agentLabels[s.agentType]}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5" style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text-primary)' }}>
                        {s.avgReward.toFixed(1)}
                      </td>
                      <td className="py-2.5" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ±{s.stdReward.toFixed(1)}
                      </td>
                      <td className="py-2.5" style={{ fontSize: '12px', color: 'var(--positive)' }}>
                        ${s.avgFinalCash.toFixed(0)}
                      </td>
                      <td className="py-2.5" style={{ fontSize: '12px', color: 'var(--negative)' }}>
                        ${s.avgPenalties.toFixed(0)}
                      </td>
                      <td className="py-2.5">
                        {s.winner && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: 'var(--warning)', color: '#fff' }}>
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