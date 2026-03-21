import type { BenchmarkResult, AgentType } from '../types'

interface Props {
  results: BenchmarkResult[]; experimentRunning: boolean; seeds: number
  trainingEpisodes: number; onSeedsChange: (n: number) => void; onRun: () => void
}

const agentLabels: Record<AgentType, string> = {
  rule: 'Rule', random: 'Random', heuristic: 'Heuristic', qtable: 'Q-Table', dqn: 'DQN',
}
const agentColors: Record<AgentType, string> = {
  rule: '#3b82f6', random: '#a8a8a8', heuristic: '#10b981', qtable: '#8b5cf6', dqn: '#ec4899',
}

export default function BenchmarkTable({ results, experimentRunning, seeds, trainingEpisodes, onSeedsChange, onRun }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span>Seeds</span>
          <input type="range" min={5} max={30} step={5} value={seeds}
                 onChange={e => onSeedsChange(Number(e.target.value))}
                 className="w-20" style={{ accentColor: '#0a0a0a' }} />
          <span style={{ fontFamily: 'var(--font-display)' }}>{seeds}</span>
          <span className="ml-2">× {trainingEpisodes} train eps</span>
        </div>
        <button
          onClick={onRun} disabled={experimentRunning}
          className="inline-flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#0a0a0a', color: 'white', opacity: experimentRunning ? 0.5 : 1, cursor: experimentRunning ? 'not-allowed' : 'pointer' }}
        >
          {experimentRunning ? 'Running…' : '⚡ Run Experiment'}
        </button>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
          Run experiment to compare all agents across all scenarios
        </p>
      ) : (
        <div className="space-y-6">
          {results.map(bench => (
            <div key={bench.scenarioId}>
              <p className="text-[11px] uppercase tracking-[0.08em] mb-3 capitalize"
                 style={{ color: 'var(--color-text-muted)' }}>
                {bench.scenarioId.replace('-', ' ')}
              </p>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Agent', 'Avg Reward', '± Std', 'Avg Cash', 'Avg Penalties', ''].map(h => (
                      <th key={h} className="pb-2 text-left text-[10px] font-medium uppercase tracking-[0.06em]"
                          style={{ color: 'var(--color-text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...bench.stats].sort((a, b) => b.avgReward - a.avgReward).map(s => (
                    <tr key={s.agentType} className="hoverable"
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          background: s.winner ? '#fffbf0' : 'transparent',
                        }}>
                      <td className="py-2.5 text-sm font-medium" style={{ color: agentColors[s.agentType] }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: agentColors[s.agentType] }} />
                          {agentLabels[s.agentType]}
                        </div>
                      </td>
                      <td className="py-2.5 text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                        {s.avgReward.toFixed(1)}
                      </td>
                      <td className="py-2.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        ±{s.stdReward.toFixed(1)}
                      </td>
                      <td className="py-2.5 text-xs" style={{ color: 'var(--color-positive)' }}>
                        ${s.avgFinalCash.toFixed(0)}
                      </td>
                      <td className="py-2.5 text-xs" style={{ color: 'var(--color-negative)' }}>
                        ${s.avgPenalties.toFixed(0)}
                      </td>
                      <td className="py-2.5">
                        {s.winner && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{ background: '#d97706', color: 'white' }}>
                            ★ winner
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